import { defineField, defineType } from 'sanity'

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery',
  type: 'document',
  fields: [
    defineField({ name: 'src', title: 'Image URL or Drive ID', type: 'string', validation: R => R.required() }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'eventSlug', title: 'Event Reference (Slug)', type: 'string' })
  ],
  preview: {
    select: { title: 'caption', subtitle: 'eventSlug' }
  }
})
