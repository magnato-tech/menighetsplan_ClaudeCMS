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
      name: 'foreldreside',
      type: 'relationship',
      relationTo: 'sider',
      admin: {
        description: 'Valgfritt: velg en annen side som denne skal vises som undermeny-punkt under.',
      },
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
        {
          slug: 'video',
          labels: { singular: 'Videoblokk', plural: 'Videoblokker' },
          fields: [
            {
              name: 'url',
              type: 'text',
              required: true,
              admin: {
                description: 'YouTube- eller Vimeo-lenke',
              },
            },
            {
              name: 'bildetekst',
              type: 'text',
            },
          ],
        },
        {
          slug: 'hero',
          labels: { singular: 'Hero-blokk', plural: 'Hero-blokker' },
          fields: [
            {
              name: 'bilde',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'overskrift',
              type: 'text',
              required: true,
            },
            {
              name: 'knappTekst',
              type: 'text',
            },
            {
              name: 'knappLenke',
              type: 'text',
            },
          ],
        },
        {
          slug: 'kalender',
          labels: { singular: 'Kalenderblokk', plural: 'Kalenderblokker' },
          fields: [
            {
              name: 'tittel',
              type: 'text',
              defaultValue: 'Kommende arrangementer',
            },
            {
              name: 'antall',
              type: 'number',
              defaultValue: 5,
              min: 1,
              max: 20,
            },
            {
              name: 'kunGudstjenester',
              type: 'checkbox',
              label: 'Vis kun gudstjenester',
              defaultValue: false,
            },
          ],
        },
        {
          slug: 'kolonner',
          labels: { singular: 'Kolonneblokk', plural: 'Kolonneblokker' },
          fields: [
            {
              name: 'kolonner',
              type: 'array',
              minRows: 2,
              maxRows: 3,
              fields: [
                {
                  name: 'overskrift',
                  type: 'text',
                },
                {
                  name: 'bilde',
                  type: 'upload',
                  relationTo: 'media',
                },
                {
                  name: 'innhold',
                  type: 'richText',
                  editor: lexicalEditor(),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
