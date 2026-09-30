import type { CollectionConfig } from 'payload'

export const Grupper: CollectionConfig = {
  slug: 'grupper',
  labels: { singular: 'Gruppe', plural: 'Grupper' },
  admin: {
    useAsTitle: 'navn',
    defaultColumns: ['navn', 'type', 'gruppeleder'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navn',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Husgruppe', value: 'husgruppe' },
        { label: 'Tjenestegruppe', value: 'tjenestegruppe' },
        { label: 'Strategigruppe', value: 'strategigruppe' },
        { label: 'Annet fellesskap', value: 'annet' },
      ],
      required: true,
    },
    {
      name: 'beskrivelse',
      type: 'textarea',
    },
    {
      name: 'gruppeleder',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'medlemmer',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
    },
  ],
}
