import { defineField, defineType, defineArrayMember } from 'sanity'

export const quizSession = defineType({
  name: 'quizSession',
  title: 'Quiz Session (Proctoring)',
  type: 'document',
  fields: [
    defineField({ name: 'teamName', title: 'Team Name', type: 'string' }),
    defineField({
      name: 'registrationRef',
      title: 'Registration Reference',
      type: 'reference',
      to: [{ type: 'registration' }]
    }),
    defineField({ name: 'eventSlug', title: 'Event Slug', type: 'string' }),
    defineField({ name: 'quizRef', title: 'Quiz Reference', type: 'string' }),
    
    defineField({
      name: 'members',
      title: 'Members Status',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'email', title: 'Email', type: 'string' }),
            defineField({ 
              name: 'status', 
              title: 'Status', 
              type: 'string',
              options: {
                list: [
                  { title: '🟢 Active', value: 'active' },
                  { title: '🔴 Offline', value: 'offline' },
                  { title: '🛑 Locked', value: 'locked' }
                ]
              },
              initialValue: 'offline'
            }),
            defineField({ name: 'isLocked', title: 'Is Locked', type: 'boolean', initialValue: false }),
            defineField({ name: 'timeRemaining', title: 'Time Remaining (sec)', type: 'number' }),
            defineField({ name: 'answers', title: 'Saved Answers (JSON)', type: 'text' })
          ]
        })
      ]
    }),

    defineField({
      name: 'proctorLogs',
      title: 'Proctor Logs',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'memberName', title: 'Member Name', type: 'string' }),
            defineField({ name: 'action', title: 'Action', type: 'string' }),
            defineField({ name: 'timestamp', title: 'Timestamp', type: 'datetime' }),
            defineField({ name: 'details', title: 'Details', type: 'string' })
          ]
        })
      ]
    }),

    defineField({ name: 'startedAt', title: 'Started At', type: 'datetime' })
  ],
  preview: {
    select: {
      title: 'teamName',
      event: 'eventSlug',
      members: 'members'
    },
    prepare({ title, event, members }) {
      const lockedMembers = (members || []).filter((m: any) => m.isLocked).length;
      const subtitle = lockedMembers > 0 
        ? `🚨 ${lockedMembers} Locked | ${event}`
        : `🟢 OK | ${event}`;

      return {
        title: title || 'Unnamed Session',
        subtitle: subtitle
      }
    }
  }
})
