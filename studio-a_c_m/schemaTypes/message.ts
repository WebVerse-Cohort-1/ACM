import { defineField, defineType } from 'sanity'

export const message = defineType({
  name: 'message',
  title: 'Message',
  type: 'document',
  fields: [
    defineField({
      name: 'user',
      title: 'User ID',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'text',
    }),
    defineField({
      name: 'timestamp',
      title: 'Timestamp',
      type: 'string',
    }),
  ],
})
