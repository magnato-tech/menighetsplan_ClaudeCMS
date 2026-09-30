import type { CollectionConfig } from 'payload'

export const Aktiviteter: CollectionConfig = {
  slug: 'aktiviteter',
  labels: { singular: 'Aktivitet', plural: 'Aktiviteter' },
  admin: {
    useAsTitle: 'tittel',
    defaultColumns: ['tittel', 'type', 'datoStart', 'status'],
    defaultSort: 'datoStart',
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
      name: 'type',
      type: 'select',
      options: [
        { label: 'Gudstjeneste', value: 'gudstjeneste' },
        { label: 'Arrangement', value: 'arrangement' },
        { label: 'Møte', value: 'mote' },
        { label: 'Bønn', value: 'bonn' },
        { label: 'Annet', value: 'annet' },
      ],
      required: true,
    },
    {
      name: 'datoStart',
      type: 'date',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'datoSlutt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'sted',
      type: 'text',
    },
    {
      name: 'beskrivelse',
      type: 'textarea',
    },
    {
      name: 'ansvarlig',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'offentlig',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Vises på den offentlige nettsiden når denne er huket av.',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Planlagt', value: 'planlagt' },
        { label: 'Avlyst', value: 'avlyst' },
      ],
      defaultValue: 'planlagt',
    },
    {
      name: 'tagger',
      type: 'array',
      fields: [{ name: 'verdi', type: 'text' }],
    },
  ],
}
