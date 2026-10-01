import { describe, it, expect } from 'vitest'
import type { Membership } from '../../src/logic/types'
import {
  finnRolleIGruppe,
  finnMineGrupper,
  finnLedetGrupper,
  erGruppeleder,
} from '../../src/logic/gruppeLogikk'

describe('gruppeLogikk', () => {
  describe('finnRolleIGruppe', () => {
    it('should return "Leder" for a leader', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'leader' },
      ]
      expect(finnRolleIGruppe(medlemskap, 'g1', 'p1')).toBe('Leder')
    })

    it('should return "Nestleder" for a deputy', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'deputy' },
      ]
      expect(finnRolleIGruppe(medlemskap, 'g1', 'p1')).toBe('Nestleder')
    })

    it('should return "Medlem" for a regular member', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'member' },
      ]
      expect(finnRolleIGruppe(medlemskap, 'g1', 'p1')).toBe('Medlem')
    })

    it('should return null if person is not a member', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'member' },
      ]
      expect(finnRolleIGruppe(medlemskap, 'g1', 'p2')).toBe(null)
    })

    it('should return null if group does not exist', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'member' },
      ]
      expect(finnRolleIGruppe(medlemskap, 'g2', 'p1')).toBe(null)
    })

    it('should return null on empty list', () => {
      expect(finnRolleIGruppe([], 'g1', 'p1')).toBe(null)
    })
  })

  describe('finnMineGrupper', () => {
    it('should return unique groupIds where person is member', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'member' },
        { groupId: 'g2', pid: 'p1', role: 'leader' },
        { groupId: 'g3', pid: 'p1', role: 'deputy' },
      ]
      const result = finnMineGrupper(medlemskap, 'p1')
      expect(result).toHaveLength(3)
      expect(result).toContain('g1')
      expect(result).toContain('g2')
      expect(result).toContain('g3')
    })

    it('should not return duplicates if person has multiple roles in same group', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'leader' },
        { groupId: 'g1', pid: 'p1', role: 'member' },
      ]
      const result = finnMineGrupper(medlemskap, 'p1')
      expect(result).toHaveLength(1)
      expect(result[0]).toBe('g1')
    })

    it('should return empty array for unknown person', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'member' },
      ]
      expect(finnMineGrupper(medlemskap, 'p2')).toHaveLength(0)
    })

    it('should return empty array on empty list', () => {
      expect(finnMineGrupper([], 'p1')).toHaveLength(0)
    })
  })

  describe('finnLedetGrupper', () => {
    it('should return groupIds where person is leader or deputy', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'leader' },
        { groupId: 'g2', pid: 'p1', role: 'deputy' },
        { groupId: 'g3', pid: 'p1', role: 'member' },
      ]
      const result = finnLedetGrupper(medlemskap, 'p1')
      expect(result).toHaveLength(2)
      expect(result).toContain('g1')
      expect(result).toContain('g2')
      expect(result).not.toContain('g3')
    })

    it('should return empty array if person only has member role', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'member' },
      ]
      expect(finnLedetGrupper(medlemskap, 'p1')).toHaveLength(0)
    })

    it('should return empty array for unknown person', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'leader' },
      ]
      expect(finnLedetGrupper(medlemskap, 'p2')).toHaveLength(0)
    })

    it('should return empty array on empty list', () => {
      expect(finnLedetGrupper([], 'p1')).toHaveLength(0)
    })
  })

  describe('erGruppeleder', () => {
    it('should return true if person leads at least one group', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'leader' },
        { groupId: 'g2', pid: 'p1', role: 'member' },
      ]
      expect(erGruppeleder(medlemskap, 'p1')).toBe(true)
    })

    it('should return true if person is deputy of at least one group', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'deputy' },
      ]
      expect(erGruppeleder(medlemskap, 'p1')).toBe(true)
    })

    it('should return false if person only has member role', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'member' },
      ]
      expect(erGruppeleder(medlemskap, 'p1')).toBe(false)
    })

    it('should return false for unknown person', () => {
      const medlemskap: Membership[] = [
        { groupId: 'g1', pid: 'p1', role: 'leader' },
      ]
      expect(erGruppeleder(medlemskap, 'p2')).toBe(false)
    })

    it('should return false on empty list', () => {
      expect(erGruppeleder([], 'p1')).toBe(false)
    })
  })
})
