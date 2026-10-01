import type { Membership } from './types'

/**
 * Finner rollen til en person i en spesifikk gruppe.
 * Returnerer null hvis personen ikke er medlem av gruppen.
 */
export function finnRolleIGruppe(
  medlemskap: Membership[],
  groupId: string,
  pid: string,
): 'Leder' | 'Nestleder' | 'Medlem' | null {
  const medlemskap_ = medlemskap.find((m) => m.groupId === groupId && m.pid === pid)
  if (!medlemskap_) return null

  if (medlemskap_.role === 'leader') return 'Leder'
  if (medlemskap_.role === 'deputy') return 'Nestleder'
  return 'Medlem'
}

/**
 * Finner alle grupper der personen er medlem (i hvilken som helst rolle).
 * Returnerer unike groupId-er.
 */
export function finnMineGrupper(medlemskap: Membership[], pid: string): string[] {
  const grupper = new Set<string>()
  for (const m of medlemskap) {
    if (m.pid === pid) {
      grupper.add(m.groupId)
    }
  }
  return Array.from(grupper)
}

/**
 * Finner grupper der personen er leder eller nestleder.
 * Returnerer unike groupId-er.
 */
export function finnLedetGrupper(medlemskap: Membership[], pid: string): string[] {
  const grupper = new Set<string>()
  for (const m of medlemskap) {
    if (m.pid === pid && (m.role === 'leader' || m.role === 'deputy')) {
      grupper.add(m.groupId)
    }
  }
  return Array.from(grupper)
}

/**
 * Sjekker om personen er leder av minst én gruppe.
 */
export function erGruppeleder(medlemskap: Membership[], pid: string): boolean {
  return finnLedetGrupper(medlemskap, pid).length > 0
}
