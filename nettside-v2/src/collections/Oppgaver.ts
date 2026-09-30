import type { CollectionConfig } from 'payload'

export const Oppgaver: CollectionConfig = {
  slug: 'oppgaver',
  labels: { singular: 'Oppgave', plural: 'Oppgaver' },
  admin: {
    useAsTitle: 'tittel',
    defaultColumns: ['tittel', 'aktivitet', 'tildeltTil', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'tittel',
      type: 'text',
      required: true,
    },
    {
      name: 'aktivitet',
      type: 'relationship',
      relationTo: 'aktiviteter',
      required: true,
    },
    {
      name: 'tildeltTil',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Ledig', value: 'ledig' },
        { label: 'Bemannet', value: 'bemannet' },
        { label: 'Forfall meldt', value: 'forfall_meldt' },
        { label: 'Fullført', value: 'fullfort' },
      ],
      defaultValue: 'ledig',
    },
    {
      name: 'erstatter',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Fylles ut når noen har tatt over etter meldt forfall.',
        condition: (data) => data?.status === 'forfall_meldt',
      },
    },
    {
      name: 'notat',
      type: 'textarea',
    },
  ],
}
