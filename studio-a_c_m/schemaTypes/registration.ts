import { defineField, defineType } from 'sanity'

export const registration = defineType({
  name: 'registration',
  title: 'Event Registration',
  type: 'document',
  fields: [
    defineField({ 
      name: 'member', 
      title: 'Member', 
      type: 'reference', 
      to: [{ type: 'member' }] 
    }),
    defineField({ 
      name: 'event', 
      title: 'Event / Quiz', 
      type: 'reference', 
      to: [{ type: 'quiz' }] 
    }),
    defineField({ 
      name: 'registrationDate', 
      title: 'Registration Date', 
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Confirmed', value: 'confirmed' },
          { title: 'Attended', value: 'attended' }
        ]
      },
      initialValue: 'pending'
    })
  ],
  preview: {
    select: { 
      memberName: 'member.name', 
      eventTitle: 'event.title',
      status: 'status'
    },
    prepare({ memberName, eventTitle, status }) {
      return {
        title: `${memberName} -> ${eventTitle}`,
        subtitle: `Status: ${status}`
      }
    }
  }
})
