import fs from 'fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where,
  collectionGroup, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-menighetsplan',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8')
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

function leaderAContext() {
  return testEnv.authenticatedContext('u-leaderA', { pid: 'p-leaderA' });
}

function deputyAContext() {
  return testEnv.authenticatedContext('u-deputyA', { pid: 'p-deputyA' });
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

function leaderBContext() {
  return testEnv.authenticatedContext('u-leaderB', { pid: 'p-leaderB' });
}

function outsiderContext() {
  return testEnv.authenticatedContext('u-outsider', { pid: 'p-outsider' });
}

function nopidContext() {
  return testEnv.authenticatedContext('u-nopid', {});
}

// Seed-funksjoner
async function seedData() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const admin = ctx.firestore();

  // Grupper
  await setDoc(doc(admin, 'groups/gA'), { name: 'A' });
  await setDoc(doc(admin, 'groups/gB'), { name: 'B' });

  // Medlemmer i gA
  await setDoc(doc(admin, 'groups/gA/members/p-leaderA'), { pid: 'p-leaderA', role: 'leader' });
  await setDoc(doc(admin, 'groups/gA/members/p-deputyA'), { pid: 'p-deputyA', role: 'deputy' });
  await setDoc(doc(admin, 'groups/gA/members/p-memberA'), { pid: 'p-memberA', role: 'member' });
  await setDoc(doc(admin, 'groups/gA/members/p-memberA2'), { pid: 'p-memberA2', role: 'member' });

  // Medlemmer i gB
  await setDoc(doc(admin, 'groups/gB/members/p-leaderB'), { pid: 'p-leaderB', role: 'leader' });
  await setDoc(doc(admin, 'groups/gB/members/p-memberB'), { pid: 'p-memberB', role: 'member' });

  // Personer
  await setDoc(doc(admin, 'persons/p-leaderA'), { displayName: 'Leader A', uid: 'u-leaderA' });
  await setDoc(doc(admin, 'persons/p-deputyA'), { displayName: 'Deputy A', uid: 'u-deputyA' });
  await setDoc(doc(admin, 'persons/p-memberA'), { displayName: 'Member A', uid: 'u-memberA' });
  await setDoc(doc(admin, 'persons/p-memberA2'), { displayName: 'Member A2', uid: 'u-memberA2' });
  await setDoc(doc(admin, 'persons/p-leaderB'), { displayName: 'Leader B', uid: 'u-leaderB' });
  await setDoc(doc(admin, 'persons/p-memberB'), { displayName: 'Member B', uid: 'u-memberB' });
  await setDoc(doc(admin, 'persons/p-outsider'), { displayName: 'Outsider', uid: 'u-outsider' });
  await setDoc(doc(admin, 'persons/p-admin'), { displayName: 'Admin', uid: 'u-admin' });
  await setDoc(doc(admin, 'persons/p-editor'), { displayName: 'Editor', uid: 'u-editor' });

  // Private kontakt for memberA
  await setDoc(doc(admin, 'persons/p-memberA/private/contact'),
    { email: 'a@x.no', birthDate: '2000-01-01' });

  // Private kontakt for memberA2
  await setDoc(doc(admin, 'persons/p-memberA2/private/contact'),
    { email: 'a2@x.no', birthDate: '2000-01-02' });

  // Member contacts
  await setDoc(doc(admin, 'groups/gA/memberContacts/p-memberA'),
    { pid: 'p-memberA', phone: '91234567' });
  await setDoc(doc(admin, 'groups/gB/memberContacts/p-memberB'),
    { pid: 'p-memberB', phone: '91234568' });

  // Meldinger
  await setDoc(doc(admin, 'groups/gA/messages/m1'),
    { authorPid: 'p-memberA', text: 'hei', createdAt: Timestamp.now() });

  // Innhold
  await setDoc(doc(admin, 'pages/pub'), { title: 'P', status: 'published' });
  await setDoc(doc(admin, 'pages/draft'), { title: 'D', status: 'draft' });
  await setDoc(doc(admin, 'news/pub'), { title: 'P', status: 'published' });
  await setDoc(doc(admin, 'news/draft'), { title: 'D', status: 'draft' });

  // Samlinger
  await setDoc(doc(admin, 'gatherings/gaA'), { title: 'x', groupId: 'gA', public: false });
  await setDoc(doc(admin, 'gatherings/gaB'), { groupId: 'gB', public: false });
  await setDoc(doc(admin, 'gatherings/gaPub'), { groupId: null, public: true });
  await setDoc(doc(admin, 'gatherings/gaAll'), { groupId: null, public: false });

  // Oppgaver
  await setDoc(doc(admin, 'tasks/tA'),
    { groupId: 'gA', gatheringId: 'gaA', title: 'T', slots: 1 });
  await setDoc(doc(admin, 'tasks/tB'),
    { groupId: 'gB', title: 'T', slots: 1 });

  // Tildelinger
  await setDoc(doc(admin, 'assignments/tA_p-memberA'),
    { taskId: 'tA', groupId: 'gA', pid: 'p-memberA', status: 'confirmed' });
  });
}

describe('Test 1: Uinnlogget', () => {
  beforeEach(async () => {
    await seedData();
  });

  it('Test 1.1: anon kan lese pages/pub', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'pages/pub');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 1.2: anon kan lese news/pub', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'news/pub');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 1.3: anon kan lese gatherings/gaPub', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'gatherings/gaPub');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 1.4: anon kan IKKE lese pages/draft', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'pages/draft');
    await assertFails(getDoc(docRef));
  });

  it('Test 1.5: anon kan IKKE lese news/draft', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'news/draft');
    await assertFails(getDoc(docRef));
  });

  it('Test 1.6: anon kan IKKE lese gatherings/gaA', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'gatherings/gaA');
    await assertFails(getDoc(docRef));
  });

  it('Test 1.7: anon kan IKKE lese persons/p-memberA', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'persons/p-memberA');
    await assertFails(getDoc(docRef));
  });

  it('Test 1.8: anon kan IKKE lese persons/p-memberA/private/contact', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'persons/p-memberA/private/contact');
    await assertFails(getDoc(docRef));
  });

  it('Test 1.9: anon kan IKKE lese groups/gA', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'groups/gA');
    await assertFails(getDoc(docRef));
  });

  it('Test 1.10: anon kan IKKE lese groups/gA/messages/m1', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/m1');
    await assertFails(getDoc(docRef));
  });

  it('Test 1.11: anon kan IKKE lese tasks/tA', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'tasks/tA');
    await assertFails(getDoc(docRef));
  });

  it('Test 1.12: anon kan IKKE lese assignments/tA_p-memberA', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA');
    await assertFails(getDoc(docRef));
  });

  it('Test 1.13: anon kan IKKE lese groups/gA/memberContacts/p-memberA', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'groups/gA/memberContacts/p-memberA');
    await assertFails(getDoc(docRef));
  });

  it('Test 1.14: anon kan IKKE skrive pages/x', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'pages/x');
    await assertFails(setDoc(docRef, { title: 'X', status: 'published' }));
  });

  it('Test 1.15: anon kan IKKE skrive groups/gA/messages/new', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/new');
    await assertFails(setDoc(docRef, { authorPid: 'p-anon', text: 'test', createdAt: serverTimestamp() }));
  });

  it('Test 1.16: anon kan IKKE liste hele pages uten filter', async () => {
    const db = anonContext().firestore();
    const q = query(collection(db, 'pages'));
    await assertFails(getDocs(q));
  });

  it('Test 1.17: anon kan liste pages med where status==published', async () => {
    const db = anonContext().firestore();
    const q = query(collection(db, 'pages'), where('status', '==', 'published'));
    await assertSucceeds(getDocs(q));
  });
});

describe('Test 2: Privatliv', () => {
  beforeEach(async () => {
    await seedData();
  });

  it('Test 2.1: memberA kan lese egen persons/p-memberA/private/contact', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'persons/p-memberA/private/contact');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 2.2: memberA kan skrive egen persons/p-memberA/private/contact', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'persons/p-memberA/private/contact');
    await assertSucceeds(setDoc(docRef, { email: 'new@x.no', birthDate: '2000-01-01' }));
  });

  it('Test 2.3: memberA2 kan IKKE lese persons/p-memberA/private/contact', async () => {
    const db = memberA2Context().firestore();
    const docRef = doc(db, 'persons/p-memberA/private/contact');
    await assertFails(getDoc(docRef));
  });

  it('Test 2.4: leaderA kan IKKE lese persons/p-memberA/private/contact', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'persons/p-memberA/private/contact');
    await assertFails(getDoc(docRef));
  });

  it('Test 2.5: editor kan IKKE lese persons/p-memberA/private/contact', async () => {
    const db = editorContext().firestore();
    const docRef = doc(db, 'persons/p-memberA/private/contact');
    await assertFails(getDoc(docRef));
  });

  it('Test 2.6: admin kan lese persons/p-memberA/private/contact', async () => {
    const db = adminContext().firestore();
    const docRef = doc(db, 'persons/p-memberA/private/contact');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 2.7: leaderA kan lese groups/gA/memberContacts/p-memberA', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'groups/gA/memberContacts/p-memberA');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 2.8: memberA2 kan IKKE lese groups/gA/memberContacts/p-memberA', async () => {
    const db = memberA2Context().firestore();
    const docRef = doc(db, 'groups/gA/memberContacts/p-memberA');
    await assertFails(getDoc(docRef));
  });

  it('Test 2.9: leaderB kan IKKE lese groups/gA/memberContacts/p-memberA', async () => {
    const db = leaderBContext().firestore();
    const docRef = doc(db, 'groups/gA/memberContacts/p-memberA');
    await assertFails(getDoc(docRef));
  });

  it('Test 2.10: memberA kan lese sin egen groups/gA/memberContacts/p-memberA', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/memberContacts/p-memberA');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 2.11: memberA kan skrive egen memberContacts', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/memberContacts/p-memberA');
    await assertSucceeds(setDoc(docRef, { pid: 'p-memberA', phone: '99999999' }));
  });

  it('Test 2.12: memberA kan IKKE skrive memberContacts for p-memberA2', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/memberContacts/p-memberA2');
    await assertFails(setDoc(docRef, { pid: 'p-memberA2', phone: '99999999' }));
  });

  it('Test 2.13: memberA kan IKKE skrive memberContacts med ekstra felt email', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/memberContacts/p-memberA');
    await assertFails(setDoc(docRef, { pid: 'p-memberA', phone: '99999999', email: 'test@x.no' }));
  });

  it('Test 2.14: memberA kan IKKE skrive memberContacts med phone > 20 tegn', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/memberContacts/p-memberA');
    await assertFails(setDoc(docRef, { pid: 'p-memberA', phone: '123456789012345678901' }));
  });
});

describe('Test 3/4: Rolle-eskalering', () => {
  beforeEach(async () => {
    await seedData();
  });

  it('Test 3.1: memberA kan IKKE skrive til users/u-memberA', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'users/u-memberA');
    await assertFails(setDoc(docRef, { role: 'admin' }));
  });

  it('Test 3.2: memberA kan IKKE opprett groups/gA/members/p-memberA som leader', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/members/p-memberA');
    await assertFails(setDoc(docRef, { pid: 'p-memberA', role: 'leader' }));
  });

  it('Test 3.3: memberA kan IKKE oppdatere persons/p-memberA med uid', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'persons/p-memberA');
    await assertFails(updateDoc(docRef, { uid: 'annen-uid' }));
  });

  it('Test 3.4: memberA kan IKKE oppdatere persons/p-memberA med role', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'persons/p-memberA');
    await assertFails(updateDoc(docRef, { role: 'admin' }));
  });

  it('Test 3.5: memberA kan oppdatere persons/p-memberA med displayName', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'persons/p-memberA');
    await assertSucceeds(updateDoc(docRef, { displayName: 'Ny' }));
  });

  it('Test 3.6: leaderA kan IKKE opprett medlem med role leader i gA', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'groups/gA/members/p-new');
    await assertFails(setDoc(docRef, { pid: 'p-new', role: 'leader' }));
  });

  it('Test 3.7: leaderA kan opprett medlem med role member i gA', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'groups/gA/members/p-new');
    await assertSucceeds(setDoc(docRef, { pid: 'p-new', role: 'member' }));
  });

  it('Test 3.8: leaderA kan opprett medlem med role deputy i gA', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'groups/gA/members/p-new');
    await assertSucceeds(setDoc(docRef, { pid: 'p-new', role: 'deputy' }));
  });

  it('Test 3.9: admin kan opprett medlem med role leader', async () => {
    const db = adminContext().firestore();
    const docRef = doc(db, 'groups/gA/members/p-new');
    await assertSucceeds(setDoc(docRef, { pid: 'p-new', role: 'leader' }));
  });

  it('Test 3.10: leaderA kan IKKE slette eller endre rolle på annen leder', async () => {
    // Seed ekstra leder
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'groups/gA/members/p-leaderA2'),
        { pid: 'p-leaderA2', role: 'leader' });
    });

    const db = leaderAContext().firestore();

    // Forsøk å slette
    const deleteRef = doc(db, 'groups/gA/members/p-leaderA2');
    await assertFails(deleteDoc(deleteRef));

    // Forsøk å oppdatere rolle
    const updateRef = doc(db, 'groups/gA/members/p-leaderA2');
    await assertFails(updateDoc(updateRef, { role: 'member' }));
  });

  it('Test 3.11: admin kan slette eller endre rolle på leder', async () => {
    // Seed ekstra leder
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'groups/gA/members/p-leaderA2'),
        { pid: 'p-leaderA2', role: 'leader' });
    });

    const adminDb = adminContext().firestore();

    // Admin kan oppdatere
    const updateRef = doc(adminDb, 'groups/gA/members/p-leaderA2');
    await assertSucceeds(updateDoc(updateRef, { role: 'member' }));
  });

  it('Test 3.12: nopid-konteksten kan IKKE lese groups/gA', async () => {
    const db = nopidContext().firestore();
    const docRef = doc(db, 'groups/gA');
    await assertFails(getDoc(docRef));
  });
});

describe('Test 5/6: Gruppeledertilgang', () => {
  beforeEach(async () => {
    await seedData();
  });

  it('Test 5.1: leaderA kan oppdatere groups/gA', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'groups/gA');
    await assertSucceeds(updateDoc(docRef, { name: 'A Updated' }));
  });

  it('Test 5.2: leaderA kan opprett task med groupId gA', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'tasks/tNew');
    await assertSucceeds(setDoc(docRef, { groupId: 'gA', title: 'New', slots: 2 }));
  });

  it('Test 5.3: leaderA kan opprett gathering med groupId gA', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'gatherings/gaNew');
    await assertSucceeds(setDoc(docRef, { groupId: 'gA', public: false }));
  });

  it('Test 5.4: leaderA kan IKKE oppdatere groups/gB', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'groups/gB');
    await assertFails(updateDoc(docRef, { name: 'B Updated' }));
  });

  it('Test 5.5: leaderA kan IKKE opprett task med groupId gB', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'tasks/tNewB');
    await assertFails(setDoc(docRef, { groupId: 'gB', title: 'New', slots: 2 }));
  });

  it('Test 5.6: leaderA kan IKKE opprett gathering med groupId gB', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'gatherings/gaNewB');
    await assertFails(setDoc(docRef, { groupId: 'gB', public: false }));
  });

  it('Test 5.7: leaderA kan IKKE flytte task fra gA til gB', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'tasks/tA');
    await assertFails(updateDoc(docRef, { groupId: 'gB' }));
  });

  it('Test 5.8: deputyA kan oppdatere groups/gA', async () => {
    const db = deputyAContext().firestore();
    const docRef = doc(db, 'groups/gA');
    await assertSucceeds(updateDoc(docRef, { name: 'A Updated' }));
  });

  it('Test 5.9: deputyA kan opprett tasks i gA', async () => {
    const db = deputyAContext().firestore();
    const docRef = doc(db, 'tasks/tNewDep');
    await assertSucceeds(setDoc(docRef, { groupId: 'gA', title: 'New', slots: 2 }));
  });

  it('Test 5.10: memberA kan IKKE oppdatere groups/gA', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA');
    await assertFails(updateDoc(docRef, { name: 'A Updated' }));
  });

  it('Test 5.11: memberA kan IKKE opprett tasks', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'tasks/tNewMem');
    await assertFails(setDoc(docRef, { groupId: 'gA', title: 'New', slots: 2 }));
  });

  it('Test 5.12: admin kan oppdatere groups/gA', async () => {
    const db = adminContext().firestore();
    const docRef = doc(db, 'groups/gA');
    await assertSucceeds(updateDoc(docRef, { name: 'A Updated' }));
  });

  it('Test 5.13: admin kan oppdatere groups/gB', async () => {
    const db = adminContext().firestore();
    const docRef = doc(db, 'groups/gB');
    await assertSucceeds(updateDoc(docRef, { name: 'B Updated' }));
  });

  it('Test 5.14: admin kan opprett gathering med groupId null', async () => {
    const db = adminContext().firestore();
    const docRef = doc(db, 'gatherings/gaNewAll');
    await assertSucceeds(setDoc(docRef, { groupId: null, public: false }));
  });

  it('Test 5.15: leaderA kan IKKE opprett gathering med groupId null', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'gatherings/gaNewAll');
    await assertFails(setDoc(docRef, { groupId: null, public: false }));
  });
});

describe('Test 7/8: CMS-innhold', () => {
  beforeEach(async () => {
    await seedData();
  });

  it('Test 7.1: editor kan opprett pages', async () => {
    const db = editorContext().firestore();
    const docRef = doc(db, 'pages/pNew');
    await assertSucceeds(setDoc(docRef, { title: 'New', status: 'draft' }));
  });

  it('Test 7.2: editor kan oppdatere pages', async () => {
    const db = editorContext().firestore();
    const docRef = doc(db, 'pages/pub');
    await assertSucceeds(updateDoc(docRef, { title: 'Updated' }));
  });

  it('Test 7.3: editor kan slette pages', async () => {
    const db = editorContext().firestore();
    const docRef = doc(db, 'pages/pub');
    await assertSucceeds(deleteDoc(docRef));
  });

  it('Test 7.4: editor kan opprett news', async () => {
    const db = editorContext().firestore();
    const docRef = doc(db, 'news/nNew');
    await assertSucceeds(setDoc(docRef, { title: 'New', status: 'draft' }));
  });

  it('Test 7.5: editor kan oppdatere news', async () => {
    const db = editorContext().firestore();
    const docRef = doc(db, 'news/pub');
    await assertSucceeds(updateDoc(docRef, { title: 'Updated' }));
  });

  it('Test 7.6: editor kan slette news', async () => {
    const db = editorContext().firestore();
    const docRef = doc(db, 'news/pub');
    await assertSucceeds(deleteDoc(docRef));
  });

  it('Test 7.7: editor kan lese pages/draft', async () => {
    const db = editorContext().firestore();
    const docRef = doc(db, 'pages/draft');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 7.8: memberA kan lese pages/pub', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'pages/pub');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 7.9: memberA kan IKKE lese pages/draft', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'pages/draft');
    await assertFails(getDoc(docRef));
  });

  it('Test 7.10: editor kan IKKE oppdatere groups/gA', async () => {
    const db = editorContext().firestore();
    const docRef = doc(db, 'groups/gA');
    await assertFails(updateDoc(docRef, { name: 'Updated' }));
  });

  it('Test 7.11: editor kan IKKE opprett tasks', async () => {
    const db = editorContext().firestore();
    const docRef = doc(db, 'tasks/tEd');
    await assertFails(setDoc(docRef, { groupId: 'gA', title: 'New', slots: 2 }));
  });

  it('Test 7.12: editor kan IKKE skrive persons', async () => {
    const db = editorContext().firestore();
    const docRef = doc(db, 'persons/p-new');
    await assertFails(setDoc(docRef, { displayName: 'New', uid: 'u-new' }));
  });

  it('Test 7.13: admin kan opprett persons', async () => {
    const db = adminContext().firestore();
    const docRef = doc(db, 'persons/p-new');
    await assertSucceeds(setDoc(docRef, { displayName: 'New', uid: 'u-new' }));
  });

  it('Test 7.14: memberA kan IKKE skrive pages', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'pages/pMem');
    await assertFails(setDoc(docRef, { title: 'New', status: 'draft' }));
  });
});

describe('Test 9: Gruppemeldinger', () => {
  beforeEach(async () => {
    await seedData();
  });

  it('Test 9.1: memberA kan lese groups/gA/messages/m1', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/m1');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 9.2: memberB kan IKKE lese groups/gA/messages/m1', async () => {
    const db = memberBContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/m1');
    await assertFails(getDoc(docRef));
  });

  it('Test 9.3: outsider kan IKKE lese groups/gA/messages/m1', async () => {
    const db = outsiderContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/m1');
    await assertFails(getDoc(docRef));
  });

  it('Test 9.4: memberA kan opprett melding med korrekt format', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/mNew');
    await assertSucceeds(setDoc(docRef,
      { authorPid: 'p-memberA', text: 'hei', createdAt: serverTimestamp() }));
  });

  it('Test 9.5: memberB kan IKKE opprett i gA', async () => {
    const db = memberBContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/mNew');
    await assertFails(setDoc(docRef,
      { authorPid: 'p-memberB', text: 'hei', createdAt: serverTimestamp() }));
  });

  it('Test 9.6: memberA kan IKKE opprett melding med falsk authorPid', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/mFalse');
    await assertFails(setDoc(docRef,
      { authorPid: 'p-memberA2', text: 'hei', createdAt: serverTimestamp() }));
  });

  it('Test 9.7: memberA kan IKKE opprett melding med tekst over 2000 tegn', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/mLong');
    const longText = 'a'.repeat(2001);
    await assertFails(setDoc(docRef,
      { authorPid: 'p-memberA', text: longText, createdAt: serverTimestamp() }));
  });

  it('Test 9.8: memberA kan IKKE opprett melding med ekstra felt', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/mExtra');
    await assertFails(setDoc(docRef,
      { authorPid: 'p-memberA', text: 'hei', createdAt: serverTimestamp(), extraField: 'no' }));
  });

  it('Test 9.9: memberA kan IKKE opprett melding med createdAt som fast dato', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/mFixed');
    await assertFails(setDoc(docRef,
      { authorPid: 'p-memberA', text: 'hei', createdAt: Timestamp.fromDate(new Date('2024-01-01')) }));
  });

  it('Test 9.10: memberA kan IKKE opprett melding med imagePath utenfor gA/chat/', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/mWrongPath');
    await assertFails(setDoc(docRef,
      { authorPid: 'p-memberA', text: 'hei', imagePath: 'groups/gB/chat/bilde.png', createdAt: serverTimestamp() }));
  });

  it('Test 9.11: memberA kan IKKE opprett tom melding uten imagePath', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/mEmpty');
    await assertFails(setDoc(docRef,
      { authorPid: 'p-memberA', text: '', createdAt: serverTimestamp() }));
  });

  it('Test 9.12: memberA kan opprett melding med tom tekst og gyldig imagePath', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/mImage');
    await assertSucceeds(setDoc(docRef,
      { authorPid: 'p-memberA', text: '', imagePath: 'groups/gA/chat/bilde1.png', createdAt: serverTimestamp() }));
  });

  it('Test 9.13: oppdatering av melding feiler for forfatter', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/m1');
    await assertFails(updateDoc(docRef, { text: 'updated' }));
  });

  it('Test 9.14: oppdatering av melding feiler for admin', async () => {
    const db = adminContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/m1');
    await assertFails(updateDoc(docRef, { text: 'updated' }));
  });

  it('Test 9.15: forfatter (memberA) kan slette egen melding', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/m1');
    await assertSucceeds(deleteDoc(docRef));
  });

  it('Test 9.16: memberA2 kan IKKE slette memberAs melding', async () => {
    const db = memberA2Context().firestore();
    const docRef = doc(db, 'groups/gA/messages/m1');
    await assertFails(deleteDoc(docRef));
  });

  it('Test 9.17: leaderA kan slette melding', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/m1');
    await assertSucceeds(deleteDoc(docRef));
  });

  it('Test 9.18: admin kan slette melding', async () => {
    const db = adminContext().firestore();
    const docRef = doc(db, 'groups/gA/messages/m1');
    await assertSucceeds(deleteDoc(docRef));
  });
});

describe('Test 14/15: Tildelinger', () => {
  beforeEach(async () => {
    await seedData();
  });

  it('Test 14.1: memberA2 kan opprett assignment for seg selv', async () => {
    const db = memberA2Context().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA2');
    await assertSucceeds(setDoc(docRef,
      { taskId: 'tA', groupId: 'gA', pid: 'p-memberA2', status: 'confirmed' }));
  });

  it('Test 14.2: memberA kan IKKE opprett assignment for p-memberA2', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA2');
    await assertFails(setDoc(docRef,
      { taskId: 'tA', groupId: 'gA', pid: 'p-memberA2', status: 'confirmed' }));
  });

  it('Test 14.3: memberA kan IKKE opprett assignment for task i gB', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'assignments/tB_p-memberA');
    await assertFails(setDoc(docRef,
      { taskId: 'tB', groupId: 'gB', pid: 'p-memberA', status: 'confirmed' }));
  });

  it('Test 14.4: memberA kan IKKE opprett assignment for tB med feil groupId', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'assignments/tB_p-memberA');
    await assertFails(setDoc(docRef,
      { taskId: 'tB', groupId: 'gA', pid: 'p-memberA', status: 'confirmed' }));
  });

  it('Test 14.5: memberA kan IKKE opprett assignment med feil dokument-ID', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA_wrong');
    await assertFails(setDoc(docRef,
      { taskId: 'tA', groupId: 'gA', pid: 'p-memberA', status: 'confirmed' }));
  });

  it('Test 14.6: medlem kan IKKE opprett assignment med status declined', async () => {
    const db = memberA2Context().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA2');
    await assertFails(setDoc(docRef,
      { taskId: 'tA', groupId: 'gA', pid: 'p-memberA2', status: 'declined' }));
  });

  it('Test 14.7: medlem kan opprett assignment med status pending', async () => {
    const db = memberA2Context().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA2');
    await assertSucceeds(setDoc(docRef,
      { taskId: 'tA', groupId: 'gA', pid: 'p-memberA2', status: 'pending' }));
  });

  it('Test 14.8: medlem kan IKKE opprett assignment med ekstra felt', async () => {
    const db = memberA2Context().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA2');
    await assertFails(setDoc(docRef,
      { taskId: 'tA', groupId: 'gA', pid: 'p-memberA2', status: 'confirmed', extraField: 'no' }));
  });

  it('Test 14.9: eier (memberA) kan oppdatere assignment til withdrawn', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA');
    await assertSucceeds(updateDoc(docRef, { status: 'withdrawn' }));
  });

  it('Test 14.10: eier kan IKKE endre pid', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA');
    await assertFails(updateDoc(docRef, { pid: 'p-memberA2' }));
  });

  it('Test 14.11: eier kan IKKE endre taskId', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA');
    await assertFails(updateDoc(docRef, { taskId: 'tB' }));
  });

  it('Test 14.12: eier kan IKKE endre groupId', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA');
    await assertFails(updateDoc(docRef, { groupId: 'gB' }));
  });

  it('Test 14.13: memberA2 kan IKKE oppdatere memberAs assignment', async () => {
    const db = memberA2Context().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA');
    await assertFails(updateDoc(docRef, { status: 'withdrawn' }));
  });

  it('Test 14.14: leaderA kan oppdatere assignment til gyldig status', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA');
    await assertSucceeds(updateDoc(docRef, { status: 'pending' }));
  });

  it('Test 14.15: leaderA kan IKKE endre pid ved oppdatering', async () => {
    const db = leaderAContext().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA');
    await assertFails(updateDoc(docRef, { pid: 'p-memberA2' }));
  });

  it('Test 14.16: outsider kan IKKE lese assignment', async () => {
    const db = outsiderContext().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA');
    await assertFails(getDoc(docRef));
  });

  it('Test 14.17: memberB kan IKKE lese assignment', async () => {
    const db = memberBContext().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA');
    await assertFails(getDoc(docRef));
  });

  it('Test 14.18: memberA2 (medlem i gA) kan lese assignment', async () => {
    const db = memberA2Context().firestore();
    const docRef = doc(db, 'assignments/tA_p-memberA');
    await assertSucceeds(getDoc(docRef));
  });
});

describe('Test 10: Oppmøte (RSVP)', () => {
  beforeEach(async () => {
    await seedData();
  });

  it('Test 10.1: memberA kan skrive RSVP til gatherings/gaA/attendances/p-memberA', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'gatherings/gaA/attendances/p-memberA');
    await assertSucceeds(setDoc(docRef, { pid: 'p-memberA', status: 'attending' }));
  });

  it('Test 10.2: memberA kan oppdatere RSVP til declined', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'gatherings/gaA/attendances/p-memberA');
    await setDoc(docRef, { pid: 'p-memberA', status: 'attending' });
    await assertSucceeds(updateDoc(docRef, { status: 'declined' }));
  });

  it('Test 10.3: memberA kan IKKE skrive RSVP for p-memberA2', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'gatherings/gaA/attendances/p-memberA2');
    await assertFails(setDoc(docRef, { pid: 'p-memberA2', status: 'attending' }));
  });

  it('Test 10.4: memberB kan IKKE skrive RSVP i gaA', async () => {
    const db = memberBContext().firestore();
    const docRef = doc(db, 'gatherings/gaA/attendances/p-memberB');
    await assertFails(setDoc(docRef, { pid: 'p-memberB', status: 'attending' }));
  });

  it('Test 10.5: memberA kan skrive RSVP til gaAll', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'gatherings/gaAll/attendances/p-memberA');
    await assertSucceeds(setDoc(docRef, { pid: 'p-memberA', status: 'attending' }));
  });

  it('Test 10.6: outsider kan skrive RSVP til gaAll', async () => {
    const db = outsiderContext().firestore();
    const docRef = doc(db, 'gatherings/gaAll/attendances/p-outsider');
    await assertSucceeds(setDoc(docRef, { pid: 'p-outsider', status: 'attending' }));
  });

  it('Test 10.7: RSVP med status maybe avvises', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'gatherings/gaA/attendances/p-memberA');
    await assertFails(setDoc(docRef, { pid: 'p-memberA', status: 'maybe' }));
  });

  it('Test 10.8: leaderA kan lese attendances under gaA', async () => {
    // Seed RSVP først
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'gatherings/gaA/attendances/p-memberA'),
        { pid: 'p-memberA', status: 'attending' });
    });

    const db = leaderAContext().firestore();
    const docRef = doc(db, 'gatherings/gaA/attendances/p-memberA');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 10.9: memberA2 kan IKKE lese memberAs RSVP', async () => {
    // Seed RSVP først
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'gatherings/gaA/attendances/p-memberA'),
        { pid: 'p-memberA', status: 'attending' });
    });

    const db = memberA2Context().firestore();
    const docRef = doc(db, 'gatherings/gaA/attendances/p-memberA');
    await assertFails(getDoc(docRef));
  });
});

describe('Test 11: Medlemskapsoppslag', () => {
  beforeEach(async () => {
    await seedData();
  });

  it('Test 11.1: memberA kan kjøre collection group query med where pid==p-memberA', async () => {
    const db = memberAContext().firestore();
    const q = query(collectionGroup(db, 'members'), where('pid', '==', 'p-memberA'));
    await assertSucceeds(getDocs(q));
  });

  it('Test 11.2: memberA query med p-memberA2 feiler', async () => {
    const db = memberAContext().firestore();
    const q = query(collectionGroup(db, 'members'), where('pid', '==', 'p-memberA2'));
    await assertFails(getDocs(q));
  });

  it('Test 11.3: collection group query uten where feiler', async () => {
    const db = memberAContext().firestore();
    const q = query(collectionGroup(db, 'members'));
    await assertFails(getDocs(q));
  });
});

describe('Test 12: Gatherings', () => {
  beforeEach(async () => {
    await seedData();
  });

  it('Test 12.1: memberA kan lese gaA', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'gatherings/gaA');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 12.2: memberA kan lese gaAll', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'gatherings/gaAll');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 12.3: memberA kan IKKE lese gaB', async () => {
    const db = memberAContext().firestore();
    const docRef = doc(db, 'gatherings/gaB');
    await assertFails(getDoc(docRef));
  });

  it('Test 12.4: anon kan lese bare gaPub', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'gatherings/gaPub');
    await assertSucceeds(getDoc(docRef));
  });

  it('Test 12.5: anon kan IKKE lese gaA', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'gatherings/gaA');
    await assertFails(getDoc(docRef));
  });

  it('Test 12.6: memberB kan IKKE lese gaA', async () => {
    const db = memberBContext().firestore();
    const docRef = doc(db, 'gatherings/gaA');
    await assertFails(getDoc(docRef));
  });

  it('Test 12.7: public gathering kan leses av anon', async () => {
    const db = anonContext().firestore();
    const docRef = doc(db, 'gatherings/gaPub');
    await assertSucceeds(getDoc(docRef));
  });
});
