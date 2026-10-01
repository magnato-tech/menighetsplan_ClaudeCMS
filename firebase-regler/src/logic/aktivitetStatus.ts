import type { Assignment, Gathering, Task } from './types'

export type StatusKlasse = 'tag-dekket' | 'tag-mangler' | 'tag-forfall'

export interface AktivitetStatus {
  label: string
  klasse: StatusKlasse
}

/**
 * Utleder status for en aktivitet fra dens oppgavers status og tildelingers svar.
 * Logikk:
 * - Ignorer oppgaver med cancelled: true
 * - Hvis ingen gjenværende oppgaver → null
 * - For hver oppgave: bekreftet = antall tildelinger med status 'confirmed' (unique pid)
 * - Oppgaven er dekket hvis bekreftet >= slots
 * - 'Forfall': minst én oppgave har withdrawn OG er IKKE dekket
 * - 'Mangler N': N = antall oppgaver som ikke er dekket
 * - 'Dekket': alle oppgaver er dekket
 * - Forfall har forrang over Mangler
 */
export function statusForAktivitet(
  gatheringId: string,
  tasks: Task[],
  assignments: Assignment[],
): AktivitetStatus | null {
  // Filtrer oppgaver som tilhører denne aktiviteten, ignorer kansellerte
  const relevanteTasks = tasks.filter((t) => t.gatheringId === gatheringId && !t.cancelled)

  // Hvis ingen gjenværende oppgaver, returner null
  if (relevanteTasks.length === 0) return null

  // Analyser hver oppgave
  let harForfall = false
  let antallManglerOppgaver = 0

  for (const task of relevanteTasks) {
    // Tell unike pid med status 'confirmed' for denne oppgaven
    const bekreftetSet = new Set<string>()
    for (const a of assignments) {
      if (a.taskId === task.id && a.status === 'confirmed') {
        bekreftetSet.add(a.pid)
      }
    }
    const bekreftet = bekreftetSet.size

    // Sjekk om oppgaven er dekket
    const erDekket = bekreftet >= task.slots

    // Sjekk for withdrawn på denne oppgaven
    const harWithdrawn = assignments.some((a) => a.taskId === task.id && a.status === 'withdrawn')

    // 'Forfall': withdrawn OG IKKE dekket
    if (harWithdrawn && !erDekket) {
      harForfall = true
    }

    // Teller oppgaver som ikke er dekket
    if (!erDekket) {
      antallManglerOppgaver++
    }
  }

  // Forfall har forrang
  if (harForfall) {
    return { label: 'Forfall', klasse: 'tag-forfall' }
  }

  // Ellers sjekk mangler
  if (antallManglerOppgaver > 0) {
    return { label: `Mangler ${antallManglerOppgaver}`, klasse: 'tag-mangler' }
  }

  // Ellers dekket
  return { label: 'Dekket', klasse: 'tag-dekket' }
}

/**
 * Grupperer aktiviteter per måned+år ("September 2026"), med stor forbokstav.
 */
export function grupperPerManed(gatherings: Gathering[]): Record<string, Gathering[]> {
  const grupper: Record<string, Gathering[]> = {}
  for (const g of gatherings) {
    const nokkel = formaterManedAr(g.startsAt)
    if (!grupper[nokkel]) grupper[nokkel] = []
    grupper[nokkel].push(g)
  }
  return grupper
}

function formaterManedAr(iso: string): string {
  const maaned = new Date(iso).toLocaleString('nb-NO', { month: 'long', year: 'numeric' })
  return maaned.charAt(0).toUpperCase() + maaned.slice(1)
}

/**
 * Sorterer månedsnøkler fra grupperPerManed kronologisk (basert på første aktivitet i hver gruppe).
 */
export function sorterManedsnokler(gruppert: Record<string, Gathering[]>): string[] {
  return Object.keys(gruppert).sort((a, b) => {
    const datoA = new Date(gruppert[a][0].startsAt).getTime()
    const datoB = new Date(gruppert[b][0].startsAt).getTime()
    return datoA - datoB
  })
}
