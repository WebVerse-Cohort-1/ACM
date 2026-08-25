import { defineField, defineType, defineArrayMember } from 'sanity'

export const about = defineType({
  name: 'about',
  title: 'About Data',
  type: 'document',
  fields: [
    defineField({ name: 'whatIsAcm', title: 'What is ACM', type: 'text' }),
    defineField({ name: 'vision', title: 'Vision Statement', type: 'text' }),
    defineField({ name: 'mission', title: 'Mission Statement (Line Separated)', type: 'text' }),
    defineField({ name: 'benefits', title: 'Benefits of Joining (Line Separated)', type: 'text' }),
    defineField({ name: 'eventsConducted', title: 'Events Conducted (Line Separated)', type: 'text' }),
    defineField({
      name: 'stats',
      title: 'Statistics',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({ name: 'value', title: 'Value', type: 'number' })
          ]
        })
      ]
    } as any),
    defineField({
      name: 'legacyLogs',
      title: 'Legacy Logs',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'year', title: 'Year', type: 'string' }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'desc', title: 'Description', type: 'text' })
          ]
        })
      ]
    } as any)
  ],
  preview: {
    prepare() {
      return { title: 'About Page Data (Edit this document)' }
    }
  }
})
