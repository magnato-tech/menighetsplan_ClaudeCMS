import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Sider: CollectionConfig = {
  slug: 'sider',
  labels: { singular: 'Side', plural: 'Sider' },
  admin: {
    useAsTitle: 'tittel',
    defaultColumns: ['tittel', 'slug', 'visIMeny'],
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
        description: 'Brukes i URL-en, f.eks. "om-oss".',
      },
    },
    {
      name: 'visIMeny',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'rekkefolge',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'blokker',
      type: 'blocks',
      blocks: [
        {
          slug: 'tekst',
          labels: { singular: 'Tekstblokk', plural: 'Tekstblokker' },
          fields: [
            {
              name: 'innhold',
              type: 'richText',
              editor: lexicalEditor(),
            },
          ],
        },
        {
          slug: 'bilde',
          labels: { singular: 'Bildeblokk', plural: 'Bildeblokker' },
          fields: [
            {
              name: 'bilde',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'bildetekst',
              type: 'text',
            },
          ],
        },
        {
          slug: 'facebook',
          labels: { singular: 'Facebook-innlegg', plural: 'Facebook-innlegg' },
          fields: [
            {
              name: 'url',
              type: 'text',
              required: true,
              admin: {
                description: 'Må starte med https://www.facebook.com/ eller https://facebook.com/',
              },
            },
          ],
        },
      ],
    },
  ],
}
