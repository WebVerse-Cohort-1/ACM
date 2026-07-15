import { defineField, defineType } from 'sanity'

export const member = defineType({
  name: 'member',
  title: 'Member',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: R => R.required() }),
    defineField({ name: 'email', title: 'Email', type: 'string', validation: R => R.required().email() }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'branch', title: 'Branch', type: 'string' }),
    defineField({ name: 'year', title: 'Year', type: 'string' }),
    defineField({ name: 'acmId', title: 'ACM Membership ID', type: 'string' }),
    defineField({ name: 'joinedDate', title: 'Joined Date', type: 'date' }),
    defineField({ 
      name: 'driveProfilePictureId', 
      title: 'Google Drive Profile Picture ID', 
      type: 'string',
      description: 'The ID of the file uploaded to Google Drive'
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'email' },
  },
})
