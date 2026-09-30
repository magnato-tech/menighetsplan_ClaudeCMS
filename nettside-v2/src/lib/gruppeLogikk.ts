import type { Grupper } from '@/payload-types'

function relId(rel: unknown): number | string | undefined {
  if (typeof rel === 'object' && rel !== null && 'id' in rel) {
    return (rel as { id: number | string }).id
  }
  return rel as number | string | undefined
}

function idIListe(liste: unknown, brukerId: number | string): boolean {
  return Array.isArray(liste) && liste.some((p) => relId(p) === brukerId)
}

/** Tilsvarer Group.leaderIds/deputyLeaderIds → "Leder"/"Nestleder"/"Medlem" på Min side. */
export function finnRolleIGruppe(gruppe: Grupper, brukerId: number | string): 'Leder' | 'Nestleder' | 'Medlem' {
  if (idIListe(gruppe.ledere, brukerId)) return 'Leder'
  if (idIListe(gruppe.varaledere, brukerId)) return 'Nestleder'
  return 'Medlem'
}

/** Grupper der brukeren er medlem, leder eller varaleder. */
export function filtrerMineGrupper(alleGrupper: Grupper[], brukerId: number | string): Grupper[] {
  return alleGrupper.filter(
    (g) => idIListe(g.medlemmer, brukerId) || idIListe(g.ledere, brukerId) || idIListe(g.varaledere, brukerId),
  )
}

/** Grupper der brukeren er leder eller varaleder (styrer om Gruppeleder-fanen vises). */
export function finnLedetGrupper(alleGrupper: Grupper[], brukerId: number | string): Grupper[] {
  return alleGrupper.filter((g) => idIListe(g.ledere, brukerId) || idIListe(g.varaledere, brukerId))
}

/** Om brukeren leder minst én gruppe — styrer om "Gruppeleder"-fanen finnes i det hele tatt. */
export function erGruppeleder(alleGrupper: Grupper[], brukerId: number | string): boolean {
  return finnLedetGrupper(alleGrupper, brukerId).length > 0
}
