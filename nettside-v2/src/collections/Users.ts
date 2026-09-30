import type { CollectionConfig } from 'payload'

export const ROLLER = [
  { label: 'Administrasjon', value: 'administrasjon' },
  { label: 'Lederskap', value: 'lederskap' },
  { label: 'Gruppeleder', value: 'gruppeleder' },
  { label: 'Frivillig', value: 'frivillig' },
  { label: 'Medlem', value: 'medlem' },
] as const

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Bruker', plural: 'Brukere' },
  admin: {
    useAsTitle: 'navn',
    defaultColumns: ['navn', 'email', 'roller'],
  },
  auth: true,
  fields: [
    {
      name: 'navn',
      type: 'text',
      required: true,
    },
    {
      name: 'roller',
      type: 'select',
      hasMany: true,
      options: [...ROLLER],
      defaultValue: ['medlem'],
      admin: {
        description:
          'Styrer hva brukeren ser og kan gjøre på Min side / i admin. En bruker kan ha flere roller.',
      },
    },
    {
      name: 'telefon',
      type: 'text',
    },
  ],
  versions: false,
}
