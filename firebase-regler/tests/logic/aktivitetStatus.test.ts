import { describe, it, expect } from 'vitest'
import type { Assignment, Gathering, Task } from '../../src/logic/types'
import { statusForAktivitet, grupperPerManed, sorterManedsnokler } from '../../src/logic/aktivitetStatus'

describe('aktivitetStatus', () => {
  describe('statusForAktivitet', () => {
    it('should return null if no tasks for gathering', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 2 },
      ]
      const assignments: Assignment[] = []
      expect(statusForAktivitet('g2', tasks, assignments)).toBe(null)
    })

    it('should return null if all tasks are cancelled', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 2, cancelled: true },
      ]
      const assignments: Assignment[] = []
      expect(statusForAktivitet('g1', tasks, assignments)).toBe(null)
    })

    it('Test 17: oppgave med slots=3 gir "Mangler 1" med to bekreftede', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 3 },
      ]
      const assignments: Assignment[] = [
        { taskId: 't1', pid: 'p1', status: 'confirmed' },
        { taskId: 't1', pid: 'p2', status: 'confirmed' },
      ]
      const result = statusForAktivitet('g1', tasks, assignments)
      expect(result).toEqual({ label: 'Mangler 1', klasse: 'tag-mangler' })
    })

    it('Test 17: oppgave med slots=3 gir "Dekket" ved tre bekreftede', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 3 },
      ]
      const assignments: Assignment[] = [
        { taskId: 't1', pid: 'p1', status: 'confirmed' },
        { taskId: 't1', pid: 'p2', status: 'confirmed' },
        { taskId: 't1', pid: 'p3', status: 'confirmed' },
      ]
      const result = statusForAktivitet('g1', tasks, assignments)
      expect(result).toEqual({ label: 'Dekket', klasse: 'tag-dekket' })
    })

    it('Test 17: samme pid to ganger teller kun én gang', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 2 },
      ]
      const assignments: Assignment[] = [
        { taskId: 't1', pid: 'p1', status: 'confirmed' },
        { taskId: 't1', pid: 'p1', status: 'confirmed' },
      ]
      const result = statusForAktivitet('g1', tasks, assignments)
      expect(result).toEqual({ label: 'Mangler 1', klasse: 'tag-mangler' })
    })

    it('Test 16: Forfall vises når én har trukket seg og oppgaven mangler', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 2 },
      ]
      const assignments: Assignment[] = [
        { taskId: 't1', pid: 'p1', status: 'withdrawn' },
      ]
      const result = statusForAktivitet('g1', tasks, assignments)
      expect(result).toEqual({ label: 'Forfall', klasse: 'tag-forfall' })
    })

    it('Test 16: Forfall forsvinner når en annen bekrefter', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 2 },
      ]
      const assignments: Assignment[] = [
        { taskId: 't1', pid: 'p1', status: 'withdrawn' },
        { taskId: 't1', pid: 'p2', status: 'confirmed' },
        { taskId: 't1', pid: 'p3', status: 'confirmed' },
      ]
      const result = statusForAktivitet('g1', tasks, assignments)
      expect(result).toEqual({ label: 'Dekket', klasse: 'tag-dekket' })
    })

    it('Test 16: oppgave med withdrawn + dekket viser "Dekket"', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 1 },
      ]
      const assignments: Assignment[] = [
        { taskId: 't1', pid: 'p1', status: 'withdrawn' },
        { taskId: 't1', pid: 'p2', status: 'confirmed' },
      ]
      const result = statusForAktivitet('g1', tasks, assignments)
      expect(result).toEqual({ label: 'Dekket', klasse: 'tag-dekket' })
    })

    it('should ignore cancelled tasks', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 2, cancelled: true },
        { id: 't2', gatheringId: 'g1', groupId: 'gr1', slots: 1 },
      ]
      const assignments: Assignment[] = []
      const result = statusForAktivitet('g1', tasks, assignments)
      expect(result).toEqual({ label: 'Mangler 1', klasse: 'tag-mangler' })
    })

    it('should not count "pending" as confirmed', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 1 },
      ]
      const assignments: Assignment[] = [
        { taskId: 't1', pid: 'p1', status: 'pending' },
      ]
      const result = statusForAktivitet('g1', tasks, assignments)
      expect(result).toEqual({ label: 'Mangler 1', klasse: 'tag-mangler' })
    })

    it('should not count "declined" as confirmed', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 1 },
      ]
      const assignments: Assignment[] = [
        { taskId: 't1', pid: 'p1', status: 'declined' },
      ]
      const result = statusForAktivitet('g1', tasks, assignments)
      expect(result).toEqual({ label: 'Mangler 1', klasse: 'tag-mangler' })
    })

    it('Forfall has priority over Mangler when multiple tasks', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 2 },
        { id: 't2', gatheringId: 'g1', groupId: 'gr1', slots: 2 },
      ]
      const assignments: Assignment[] = [
        // t1: withdrawn + missing (only 0 confirmed)
        { taskId: 't1', pid: 'p1', status: 'withdrawn' },
        // t2: missing (0 confirmed)
      ]
      const result = statusForAktivitet('g1', tasks, assignments)
      expect(result).toEqual({ label: 'Forfall', klasse: 'tag-forfall' })
    })

    it('should count multiple missing tasks in Mangler label', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 1 },
        { id: 't2', gatheringId: 'g1', groupId: 'gr1', slots: 1 },
        { id: 't3', gatheringId: 'g1', groupId: 'gr1', slots: 1 },
      ]
      const assignments: Assignment[] = [
        { taskId: 't1', pid: 'p1', status: 'confirmed' },
      ]
      const result = statusForAktivitet('g1', tasks, assignments)
      expect(result).toEqual({ label: 'Mangler 2', klasse: 'tag-mangler' })
    })

    it('should return Dekket when all tasks are covered', () => {
      const tasks: Task[] = [
        { id: 't1', gatheringId: 'g1', groupId: 'gr1', slots: 2 },
        { id: 't2', gatheringId: 'g1', groupId: 'gr1', slots: 1 },
      ]
      const assignments: Assignment[] = [
        { taskId: 't1', pid: 'p1', status: 'confirmed' },
        { taskId: 't1', pid: 'p2', status: 'confirmed' },
        { taskId: 't2', pid: 'p3', status: 'confirmed' },
      ]
      const result = statusForAktivitet('g1', tasks, assignments)
      expect(result).toEqual({ label: 'Dekket', klasse: 'tag-dekket' })
    })
  })

  describe('grupperPerManed', () => {
    it('should group gatherings by month and year', () => {
      const gatherings: Gathering[] = [
        { id: 'g1', startsAt: '2026-09-15T10:00:00Z', title: 'Event 1' },
        { id: 'g2', startsAt: '2026-09-20T14:00:00Z', title: 'Event 2' },
        { id: 'g3', startsAt: '2026-10-05T10:00:00Z', title: 'Event 3' },
      ]
      const result = grupperPerManed(gatherings)
      expect(Object.keys(result)).toHaveLength(2)
      expect(result['September 2026']).toHaveLength(2)
      expect(result['Oktober 2026']).toHaveLength(1)
    })

    it('should capitalize first letter of month', () => {
      const gatherings: Gathering[] = [
        { id: 'g1', startsAt: '2026-01-01T10:00:00Z', title: 'Event 1' },
      ]
      const result = grupperPerManed(gatherings)
      const keys = Object.keys(result)
      expect(keys[0]).toMatch(/^[A-Z]/)
    })

    it('should handle multiple years', () => {
      const gatherings: Gathering[] = [
        { id: 'g1', startsAt: '2025-12-01T10:00:00Z', title: 'Event 1' },
        { id: 'g2', startsAt: '2026-01-01T10:00:00Z', title: 'Event 2' },
      ]
      const result = grupperPerManed(gatherings)
      expect(Object.keys(result)).toHaveLength(2)
      expect(Object.keys(result).some((k) => k.includes('2025'))).toBe(true)
      expect(Object.keys(result).some((k) => k.includes('2026'))).toBe(true)
    })
  })

  describe('sorterManedsnokler', () => {
    it('should sort chronologically', () => {
      const gruppering: Record<string, Gathering[]> = {
        'Oktober 2026': [
          { id: 'g3', startsAt: '2026-10-05T10:00:00Z', title: 'Event 3' },
        ],
        'September 2026': [
          { id: 'g1', startsAt: '2026-09-15T10:00:00Z', title: 'Event 1' },
          { id: 'g2', startsAt: '2026-09-20T14:00:00Z', title: 'Event 2' },
        ],
      }
      const result = sorterManedsnokler(gruppering)
      expect(result).toEqual(['September 2026', 'Oktober 2026'])
    })

    it('should handle year boundaries correctly', () => {
      const gruppering: Record<string, Gathering[]> = {
        'Januar 2026': [
          { id: 'g2', startsAt: '2026-01-01T10:00:00Z', title: 'Event 2' },
        ],
        'Desember 2025': [
          { id: 'g1', startsAt: '2025-12-01T10:00:00Z', title: 'Event 1' },
        ],
      }
      const result = sorterManedsnokler(gruppering)
      expect(result).toEqual(['Desember 2025', 'Januar 2026'])
    })

    it('should sort by first gathering in each group', () => {
      const gruppering: Record<string, Gathering[]> = {
        'Oktober 2026': [
          { id: 'g2', startsAt: '2026-10-10T10:00:00Z', title: 'Event 2' },
          { id: 'g1', startsAt: '2026-10-01T10:00:00Z', title: 'Event 1' },
        ],
        'September 2026': [
          { id: 'g3', startsAt: '2026-09-15T10:00:00Z', title: 'Event 3' },
        ],
      }
      const result = sorterManedsnokler(gruppering)
      expect(result).toEqual(['September 2026', 'Oktober 2026'])
    })

    it('should return sorted keys for single month', () => {
      const gruppering: Record<string, Gathering[]> = {
        'September 2026': [
          { id: 'g1', startsAt: '2026-09-15T10:00:00Z', title: 'Event 1' },
        ],
      }
      const result = sorterManedsnokler(gruppering)
      expect(result).toEqual(['September 2026'])
    })
  })
})
