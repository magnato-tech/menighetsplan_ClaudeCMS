import { describe, it, expect } from 'vitest'
import {
  finnRolleIGruppe,
  filtrerMineGrupper,
  finnLedetGrupper,
  erGruppeleder,
} from '@/lib/gruppeLogikk'
import type { Grupper } from '@/payload-types'

describe('gruppeLogikk: finnRolleIGruppe', () => {
  it('returnerer "Leder" når bruker-id er i ledere (tallform)', () => {
    const gruppe = {
      id: 1,
      navn: 'Test gruppe',
      ledere: [5, 10],
      varaledere: [3],
      medlemmer: [1, 5, 10],
    } as unknown as Grupper
    expect(finnRolleIGruppe(gruppe, 5)).toBe('Leder')
    expect(finnRolleIGruppe(gruppe, 10)).toBe('Leder')
  })

  it('returnerer "Leder" når bruker-id er i ledere (objektform)', () => {
    const gruppe = {
      id: 1,
      navn: 'Test gruppe',
      ledere: [{ id: 5 }, { id: 10 }] as never,
      varaledere: [3],
      medlemmer: [1, 5, 10],
    } as unknown as Grupper
    expect(finnRolleIGruppe(gruppe, 5)).toBe('Leder')
    expect(finnRolleIGruppe(gruppe, 10)).toBe('Leder')
  })

  it('returnerer "Nestleder" når bruker-id er i varaledere (tallform)', () => {
    const gruppe = {
      id: 1,
      navn: 'Test gruppe',
      ledere: [5],
      varaledere: [3, 7],
      medlemmer: [1, 3, 5, 7],
    } as unknown as Grupper
    expect(finnRolleIGruppe(gruppe, 3)).toBe('Nestleder')
    expect(finnRolleIGruppe(gruppe, 7)).toBe('Nestleder')
  })

  it('returnerer "Nestleder" når bruker-id er i varaledere (objektform)', () => {
    const gruppe = {
      id: 1,
      navn: 'Test gruppe',
      ledere: [5],
      varaledere: [{ id: 3 }, { id: 7 }] as never,
      medlemmer: [1, 3, 5, 7],
    } as unknown as Grupper
    expect(finnRolleIGruppe(gruppe, 3)).toBe('Nestleder')
    expect(finnRolleIGruppe(gruppe, 7)).toBe('Nestleder')
  })

  it('returnerer "Medlem" når bruker ikke er leder eller varaleder', () => {
    const gruppe = {
      id: 1,
      navn: 'Test gruppe',
      ledere: [5],
      varaledere: [3],
      medlemmer: [1, 2, 3, 5, 99],
    } as unknown as Grupper
    expect(finnRolleIGruppe(gruppe, 1)).toBe('Medlem')
    expect(finnRolleIGruppe(gruppe, 2)).toBe('Medlem')
    expect(finnRolleIGruppe(gruppe, 99)).toBe('Medlem')
  })

  it('returnerer "Medlem" når bruker-id ikke finnes i noen liste', () => {
    const gruppe = {
      id: 1,
      navn: 'Test gruppe',
      ledere: [5],
      varaledere: [3],
      medlemmer: [1, 5, 3],
    } as unknown as Grupper
    expect(finnRolleIGruppe(gruppe, 999)).toBe('Medlem')
  })

  it('behandler blanding av tall og objekt form i samme liste', () => {
    const gruppe = {
      id: 1,
      navn: 'Test gruppe',
      ledere: [5, { id: 10 }] as never,
      varaledere: [],
      medlemmer: [1, 2, 3, 5, 10],
    } as unknown as Grupper
    expect(finnRolleIGruppe(gruppe, 5)).toBe('Leder')
    expect(finnRolleIGruppe(gruppe, 10)).toBe('Leder')
  })
})

describe('gruppeLogikk: filtrerMineGrupper', () => {
  it('returnerer grupper der bruker er medlem', () => {
    const grupper = [
      { id: 1, navn: 'Gruppe 1', medlemmer: [5, 10], ledere: [], varaledere: [] } as unknown as Grupper,
      { id: 2, navn: 'Gruppe 2', medlemmer: [3, 7], ledere: [], varaledere: [] } as unknown as Grupper,
      { id: 3, navn: 'Gruppe 3', medlemmer: [1], ledere: [], varaledere: [] } as unknown as Grupper,
    ]
    const result = filtrerMineGrupper(grupper, 5)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('returnerer grupper der bruker er leder', () => {
    const grupper = [
      { id: 1, navn: 'Gruppe 1', medlemmer: [1], ledere: [5], varaledere: [] } as unknown as Grupper,
      { id: 2, navn: 'Gruppe 2', medlemmer: [3, 7], ledere: [], varaledere: [] } as unknown as Grupper,
    ]
    const result = filtrerMineGrupper(grupper, 5)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('returnerer grupper der bruker er varaleder', () => {
    const grupper = [
      { id: 1, navn: 'Gruppe 1', medlemmer: [1], ledere: [], varaledere: [5] } as unknown as Grupper,
      { id: 2, navn: 'Gruppe 2', medlemmer: [3, 7], ledere: [], varaledere: [] } as unknown as Grupper,
    ]
    const result = filtrerMineGrupper(grupper, 5)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('returnerer grupper der bruker er medlem, leder ELLER varaleder', () => {
    const grupper = [
      { id: 1, navn: 'Som medlem', medlemmer: [5], ledere: [], varaledere: [] } as unknown as Grupper,
      { id: 2, navn: 'Som leder', medlemmer: [1], ledere: [5], varaledere: [] } as unknown as Grupper,
      { id: 3, navn: 'Som varaleder', medlemmer: [1], ledere: [], varaledere: [5] } as unknown as Grupper,
      { id: 4, navn: 'Ikke medlem', medlemmer: [1, 2, 3], ledere: [], varaledere: [] } as unknown as Grupper,
    ]
    const result = filtrerMineGrupper(grupper, 5)
    expect(result).toHaveLength(3)
    expect(result.map((g) => g.id).sort()).toEqual([1, 2, 3])
  })

  it('ekskluderer grupper bruker ikke er i', () => {
    const grupper = [
      { id: 1, navn: 'Gruppe 1', medlemmer: [1, 2], ledere: [3], varaledere: [4] } as unknown as Grupper,
      { id: 2, navn: 'Gruppe 2', medlemmer: [6, 7], ledere: [8], varaledere: [9] } as unknown as Grupper,
    ]
    const result = filtrerMineGrupper(grupper, 5)
    expect(result).toHaveLength(0)
  })

  it('returnerer tom liste når ingen grupper eksisterer', () => {
    const result = filtrerMineGrupper([], 5)
    expect(result).toHaveLength(0)
  })

  it('håndterer objektform i medlemmer/ledere/varaledere', () => {
    const grupper = [
      {
        id: 1,
        navn: 'Gruppe 1',
        medlemmer: [{ id: 5 }] as never,
        ledere: [],
        varaledere: [],
      } as unknown as Grupper,
    ]
    const result = filtrerMineGrupper(grupper, 5)
    expect(result).toHaveLength(1)
  })
})

describe('gruppeLogikk: finnLedetGrupper', () => {
  it('returnerer KUN grupper der bruker er leder', () => {
    const grupper = [
      { id: 1, navn: 'Gruppe 1', medlemmer: [5, 10], ledere: [5], varaledere: [] } as unknown as Grupper,
      { id: 2, navn: 'Gruppe 2', medlemmer: [5, 3], ledere: [3], varaledere: [] } as unknown as Grupper,
      { id: 3, navn: 'Gruppe 3', medlemmer: [1], ledere: [], varaledere: [] } as unknown as Grupper,
    ]
    const result = finnLedetGrupper(grupper, 5)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('returnerer KUN grupper der bruker er varaleder', () => {
    const grupper = [
      { id: 1, navn: 'Gruppe 1', medlemmer: [5, 10], ledere: [], varaledere: [5] } as unknown as Grupper,
      { id: 2, navn: 'Gruppe 2', medlemmer: [5, 3], ledere: [3], varaledere: [] } as unknown as Grupper,
    ]
    const result = finnLedetGrupper(grupper, 5)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('returnerer grupper der bruker er leder ELLER varaleder', () => {
    const grupper = [
      { id: 1, navn: 'Som leder', medlemmer: [5], ledere: [5], varaledere: [] } as unknown as Grupper,
      { id: 2, navn: 'Som varaleder', medlemmer: [5], ledere: [], varaledere: [5] } as unknown as Grupper,
      { id: 3, navn: 'Bare medlem', medlemmer: [5], ledere: [3], varaledere: [] } as unknown as Grupper,
      { id: 4, navn: 'Ingen rolle', medlemmer: [1], ledere: [1], varaledere: [] } as unknown as Grupper,
    ]
    const result = finnLedetGrupper(grupper, 5)
    expect(result).toHaveLength(2)
    expect(result.map((g) => g.id).sort()).toEqual([1, 2])
  })

  it('ekskluderer grupper der bruker bare er medlem', () => {
    const grupper = [
      { id: 1, navn: 'Gruppe 1', medlemmer: [5], ledere: [3], varaledere: [] } as unknown as Grupper,
      { id: 2, navn: 'Gruppe 2', medlemmer: [5], ledere: [], varaledere: [3] } as unknown as Grupper,
    ]
    const result = finnLedetGrupper(grupper, 5)
    expect(result).toHaveLength(0)
  })

  it('returnerer tom liste når ingen grupper eksisterer', () => {
    const result = finnLedetGrupper([], 5)
    expect(result).toHaveLength(0)
  })
})

describe('gruppeLogikk: erGruppeleder', () => {
  it('returnerer true når bruker leder minst én gruppe', () => {
    const grupper = [
      { id: 1, navn: 'Gruppe 1', medlemmer: [5], ledere: [5], varaledere: [] } as unknown as Grupper,
      { id: 2, navn: 'Gruppe 2', medlemmer: [1], ledere: [1], varaledere: [] } as unknown as Grupper,
    ]
    expect(erGruppeleder(grupper, 5)).toBe(true)
  })

  it('returnerer true når bruker er varaleder i minst én gruppe', () => {
    const grupper = [
      { id: 1, navn: 'Gruppe 1', medlemmer: [5], ledere: [3], varaledere: [5] } as unknown as Grupper,
      { id: 2, navn: 'Gruppe 2', medlemmer: [1], ledere: [1], varaledere: [] } as unknown as Grupper,
    ]
    expect(erGruppeleder(grupper, 5)).toBe(true)
  })

  it('returnerer false når bruker bare er medlem', () => {
    const grupper = [
      { id: 1, navn: 'Gruppe 1', medlemmer: [5], ledere: [3], varaledere: [7] } as unknown as Grupper,
      { id: 2, navn: 'Gruppe 2', medlemmer: [5, 1], ledere: [1], varaledere: [] } as unknown as Grupper,
    ]
    expect(erGruppeleder(grupper, 5)).toBe(false)
  })

  it('returnerer false når bruker ikke er i noen gruppe', () => {
    const grupper = [
      { id: 1, navn: 'Gruppe 1', medlemmer: [1], ledere: [1], varaledere: [] } as unknown as Grupper,
      { id: 2, navn: 'Gruppe 2', medlemmer: [2], ledere: [2], varaledere: [] } as unknown as Grupper,
    ]
    expect(erGruppeleder(grupper, 5)).toBe(false)
  })

  it('returnerer false når ingen grupper eksisterer', () => {
    expect(erGruppeleder([], 5)).toBe(false)
  })

  it('returnerer true når bruker leder flere grupper', () => {
    const grupper = [
      { id: 1, navn: 'Gruppe 1', medlemmer: [5], ledere: [5], varaledere: [] } as unknown as Grupper,
      { id: 2, navn: 'Gruppe 2', medlemmer: [5], ledere: [5], varaledere: [] } as unknown as Grupper,
      { id: 3, navn: 'Gruppe 3', medlemmer: [1], ledere: [1], varaledere: [] } as unknown as Grupper,
    ]
    expect(erGruppeleder(grupper, 5)).toBe(true)
  })
})
