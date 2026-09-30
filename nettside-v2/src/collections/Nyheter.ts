import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Nyheter: CollectionConfig = {
  slug: 'nyheter',
  labels: { singular: 'Nyhet', plural: 'Nyheter' },
  admin: {
    useAsTitle: 'tittel',
    defaultColumns: ['tittel', 'publisertDato'],
    group: 'Innhold',
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
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Brukes i URL-en, f.eks. "menighetsskolen-modul-3".',
      },
    },
    {
      name: 'bilde',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'ingress',
      type: 'textarea',
      admin: {
        description: 'Kort tekst som vises på forsiden sammen med bildet.',
      },
    },
    {
      name: 'innhold',
      type: 'richText',
      editor: lexicalEditor(),
    },
    {
      name: 'publisertDato',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
    },
  ],
}
