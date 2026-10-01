import fs from 'fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-menighetsplan',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8')
    },
    storage: {
      rules: fs.readFileSync('storage.rules', 'utf8')
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// Helper funksjoner for å lage kontekster
function anonContext() {
  return testEnv.unauthenticatedContext();
}

function adminContext() {
  return testEnv.authenticatedContext('u-admin', { role: 'admin', pid: 'p-admin' });
}

function editorContext() {
  return testEnv.authenticatedContext('u-editor', { role: 'editor', pid: 'p-editor' });
}

function memberAContext() {
  return testEnv.authenticatedContext('u-memberA', { pid: 'p-memberA' });
}

function memberA2Context() {
  return testEnv.authenticatedContext('u-memberA2', { pid: 'p-memberA2' });
}

function memberBContext() {
  return testEnv.authenticatedContext('u-memberB', { pid: 'p-memberB' });
}

function leaderAContext() {
  return testEnv.authenticatedContext('u-leaderA', { pid: 'p-leaderA' });
}

// Seed Firestore-data (grupper og medlemmer for storage rules)
async function seedFirestoreData() {
  const admin = adminContext().firestore();

  // Grupper
  await setDoc(doc(admin, 'groups/gA'), { name: 'A' });
  await setDoc(doc(admin, 'groups/gB'), { name: 'B' });

  // Medlemmer i gA
  await setDoc(doc(admin, 'groups/gA/members/p-memberA'), { pid: 'p-memberA', role: 'member' });
  await setDoc(doc(admin, 'groups/gA/members/p-memberA2'), { pid: 'p-memberA2', role: 'member' });
  await setDoc(doc(admin, 'groups/gA/members/p-leaderA'), { pid: 'p-leaderA', role: 'leader' });

  // Medlemmer i gB
  await setDoc(doc(admin, 'groups/gB/members/p-memberB'), { pid: 'p-memberB', role: 'member' });

  // Personer (for profil-bilder)
  await setDoc(doc(admin, 'persons/p-memberA'), { displayName: 'Member A', uid: 'u-memberA' });
  await setDoc(doc(admin, 'persons/p-memberA2'), { displayName: 'Member A2', uid: 'u-memberA2' });
}

// Seed Storage-filer med security rules disabled
async function seedStorageData() {
  const adminStorage = testEnv.withSecurityRulesDisabled(async (context) => {
    const storage = context.storage();
    const logoRef = ref(storage, 'public/logo.png');
    const logoData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG header
    await uploadBytes(logoRef, logoData, { contentType: 'image/png' });
  });
}

describe('Storage: Offentlige filer', () => {
  beforeEach(async () => {
    await seedFirestoreData();
    await seedStorageData();
  });

  it('Test Storage 1.1: anon kan lese public/logo.png', async () => {
    const storage = anonContext().storage();
    const logoRef = ref(storage, 'public/logo.png');
    await assertSucceeds(getBytes(logoRef));
  });

  it('Test Storage 1.2: anon kan IKKE skrive til public/logo.png', async () => {
    const storage = anonContext().storage();
    const logoRef = ref(storage, 'public/logo.png');
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    await assertFails(uploadBytes(logoRef, data, { contentType: 'image/png' }));
  });

  it('Test Storage 1.3: editor kan laste opp public/x.png', async () => {
    const storage = editorContext().storage();
    const fileRef = ref(storage, 'public/x.png');
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    await assertSucceeds(uploadBytes(fileRef, data, { contentType: 'image/png' }));
  });

  it('Test Storage 1.4: memberA kan IKKE laste opp public/x.png', async () => {
    const storage = memberAContext().storage();
    const fileRef = ref(storage, 'public/x.png');
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    await assertFails(uploadBytes(fileRef, data, { contentType: 'image/png' }));
  });
});

describe('Storage: Gruppechat-bilder', () => {
  beforeEach(async () => {
    await seedFirestoreData();
    await seedStorageData();
  });

  it('Test Storage 2.1: memberA kan laste opp groups/gA/chat/a.png', async () => {
    const storage = memberAContext().storage();
    const fileRef = ref(storage, 'groups/gA/chat/a.png');
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    await assertSucceeds(uploadBytes(fileRef, data, { contentType: 'image/png' }));
  });

  it('Test Storage 2.2: memberA kan lese groups/gA/chat/a.png', async () => {
    // Seed filen først
    const adminStorage = testEnv.withSecurityRulesDisabled(async (context) => {
      const storage = context.storage();
      const fileRef = ref(storage, 'groups/gA/chat/a.png');
      const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      await uploadBytes(fileRef, data, { contentType: 'image/png' });
    });

    const storage = memberAContext().storage();
    const fileRef = ref(storage, 'groups/gA/chat/a.png');
    await assertSucceeds(getBytes(fileRef));
  });

  it('Test Storage 2.3: memberB kan IKKE lese groups/gA/chat/a.png', async () => {
    // Seed filen først
    const adminStorage = testEnv.withSecurityRulesDisabled(async (context) => {
      const storage = context.storage();
      const fileRef = ref(storage, 'groups/gA/chat/a.png');
      const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      await uploadBytes(fileRef, data, { contentType: 'image/png' });
    });

    const storage = memberBContext().storage();
    const fileRef = ref(storage, 'groups/gA/chat/a.png');
    await assertFails(getBytes(fileRef));
  });

  it('Test Storage 2.4: memberB kan IKKE laste opp groups/gA/chat/b.png', async () => {
    const storage = memberBContext().storage();
    const fileRef = ref(storage, 'groups/gA/chat/b.png');
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    await assertFails(uploadBytes(fileRef, data, { contentType: 'image/png' }));
  });

  it('Test Storage 2.5: memberA kan IKKE laste opp text/plain-fil i chat', async () => {
    const storage = memberAContext().storage();
    const fileRef = ref(storage, 'groups/gA/chat/text.txt');
    const data = new Uint8Array([0x54, 0x65, 0x78, 0x74]); // "Text" in ASCII
    await assertFails(uploadBytes(fileRef, data, { contentType: 'text/plain' }));
  });

  it('Test Storage 2.6: memberA kan IKKE laste opp fil over 5 MB', async () => {
    const storage = memberAContext().storage();
    const fileRef = ref(storage, 'groups/gA/chat/large.png');
    const largeData = new Uint8Array(5 * 1024 * 1024 + 1); // 5 MB + 1 byte
    // Fill with PNG header at start
    largeData[0] = 0x89;
    largeData[1] = 0x50;
    largeData[2] = 0x4e;
    largeData[3] = 0x47;
    await assertFails(uploadBytes(fileRef, largeData, { contentType: 'image/png' }));
  });
});

describe('Storage: Profilbilder', () => {
  beforeEach(async () => {
    await seedFirestoreData();
    await seedStorageData();
  });

  it('Test Storage 3.1: memberA kan laste opp profiles/p-memberA/me.png', async () => {
    const storage = memberAContext().storage();
    const fileRef = ref(storage, 'profiles/p-memberA/me.png');
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    await assertSucceeds(uploadBytes(fileRef, data, { contentType: 'image/png' }));
  });

  it('Test Storage 3.2: memberA kan IKKE laste opp profiles/p-memberA2/me.png', async () => {
    const storage = memberAContext().storage();
    const fileRef = ref(storage, 'profiles/p-memberA2/me.png');
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    await assertFails(uploadBytes(fileRef, data, { contentType: 'image/png' }));
  });

  it('Test Storage 3.3: innlogget memberA kan lese profiles/p-memberA/me.png', async () => {
    // Seed filen først
    const adminStorage = testEnv.withSecurityRulesDisabled(async (context) => {
      const storage = context.storage();
      const fileRef = ref(storage, 'profiles/p-memberA/me.png');
      const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      await uploadBytes(fileRef, data, { contentType: 'image/png' });
    });

    const storage = memberAContext().storage();
    const fileRef = ref(storage, 'profiles/p-memberA/me.png');
    await assertSucceeds(getBytes(fileRef));
  });

  it('Test Storage 3.4: innlogget memberA2 kan lese profiles/p-memberA/me.png', async () => {
    // Seed filen først
    const adminStorage = testEnv.withSecurityRulesDisabled(async (context) => {
      const storage = context.storage();
      const fileRef = ref(storage, 'profiles/p-memberA/me.png');
      const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      await uploadBytes(fileRef, data, { contentType: 'image/png' });
    });

    const storage = memberA2Context().storage();
    const fileRef = ref(storage, 'profiles/p-memberA/me.png');
    await assertSucceeds(getBytes(fileRef));
  });

  it('Test Storage 3.5: anon kan IKKE lese profiles/p-memberA/me.png', async () => {
    // Seed filen først
    const adminStorage = testEnv.withSecurityRulesDisabled(async (context) => {
      const storage = context.storage();
      const fileRef = ref(storage, 'profiles/p-memberA/me.png');
      const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      await uploadBytes(fileRef, data, { contentType: 'image/png' });
    });

    const storage = anonContext().storage();
    const fileRef = ref(storage, 'profiles/p-memberA/me.png');
    await assertFails(getBytes(fileRef));
  });

  it('Test Storage 3.6: admin kan slette groups/gA/chat/a.png', async () => {
    // Seed filen først
    const adminStorage = testEnv.withSecurityRulesDisabled(async (context) => {
      const storage = context.storage();
      const fileRef = ref(storage, 'groups/gA/chat/a.png');
      const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      await uploadBytes(fileRef, data, { contentType: 'image/png' });
    });

    const storage = adminContext().storage();
    const fileRef = ref(storage, 'groups/gA/chat/a.png');
    await assertSucceeds(deleteObject(fileRef));
  });

  it('Test Storage 3.7: memberA kan IKKE slette groups/gA/chat/a.png', async () => {
    // Seed filen først
    const adminStorage = testEnv.withSecurityRulesDisabled(async (context) => {
      const storage = context.storage();
      const fileRef = ref(storage, 'groups/gA/chat/a.png');
      const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      await uploadBytes(fileRef, data, { contentType: 'image/png' });
    });

    const storage = memberAContext().storage();
    const fileRef = ref(storage, 'groups/gA/chat/a.png');
    await assertFails(deleteObject(fileRef));
  });
});
