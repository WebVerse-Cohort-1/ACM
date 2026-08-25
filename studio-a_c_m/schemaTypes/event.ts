import { defineField, defineType, defineArrayMember } from 'sanity'

export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: R => R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: R => R.required() }),
    defineField({ name: 'category', title: 'Category (e.g., Hackathon, Workshop)', type: 'string' }),
    defineField({ name: 'dateText', title: 'Date Text (e.g., March 15-16)', type: 'string' }),
    defineField({ name: 'eventDate', title: 'Event Date', type: 'datetime' }),
    defineField({ name: 'desc', title: 'Description', type: 'text' }),
    defineField({ name: 'images', title: 'Images (URLs or Drive IDs)', type: 'array', of: [{ type: 'string' }] } as any),
    defineField({ name: 'prizePool', title: 'Prize Pool', type: 'number' }),
    defineField({ name: 'maxTeamSize', title: 'Max Team Size', type: 'number' }),
    defineField({
      name: 'tracks',
      title: 'Tracks',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'desc', title: 'Description', type: 'text' })
          ]
        })
      ]
    } as any),
    defineField({
      name: 'speakers',
      title: 'Speakers',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'role', title: 'Role', type: 'string' }),
            defineField({ name: 'image', title: 'Image URL/ID', type: 'string' }),
            defineField({ name: 'linkedin', title: 'LinkedIn URL', type: 'string' })
          ]
        })
      ]
    } as any),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'q', title: 'Question', type: 'string' }),
            defineField({ name: 'a', title: 'Answer', type: 'text' })
          ]
        })
      ]
    } as any),
    defineField({
      name: 'registrationStatus',
      title: 'Registration Status',
      type: 'string',
      options: {
        list: [
          { title: 'Open', value: 'open' },
          { title: 'Started', value: 'started' },
          { title: 'Completed', value: 'completed' },
          { title: 'Custom', value: 'custom' },
        ],
        layout: 'radio',
      },
      initialValue: 'open',
    }),
    defineField({
      name: 'customStatusText',
      title: 'Custom Status/Concluded Text',
      type: 'string',
      description: 'Custom message to display if registrations are closed, event has started/completed (e.g., "Hackathon In Progress", "Registration Closed").',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'category' }
  }
})
