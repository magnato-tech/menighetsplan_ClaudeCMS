import type { CollectionConfig } from 'payload'

export const Oppmoter: CollectionConfig = {
  slug: 'oppmoter',
  labels: { singular: 'Oppmøte (RSVP)', plural: 'Oppmøter (RSVP)' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['aktivitet', 'person', 'status'],
    group: 'Kommunikasjon',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'aktivitet',
      type: 'relationship',
      relationTo: 'aktiviteter',
      required: true,
    },
    {
      name: 'person',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Kommer', value: 'attending' },
        { label: 'Kommer ikke', value: 'declined' },
      ],
      required: true,
    },
  ],
}
