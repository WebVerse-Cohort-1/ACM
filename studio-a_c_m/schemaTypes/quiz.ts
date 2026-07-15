import { defineField, defineType } from 'sanity'

export const quiz = defineType({
  name: 'quiz',
  title: 'Quiz / Event',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: R => R.required() }),
    defineField({ name: 'eventSlug', title: 'Event Slug', type: 'string' }),
    defineField({ 
      name: 'driveCoverImageId', 
      title: 'Google Drive Cover Image ID', 
      type: 'string',
      description: 'The ID of the file uploaded to Google Drive'
    }),
    defineField({ name: 'durationMinutes', title: 'Duration (minutes)', type: 'number' }),
    defineField({ name: 'marksPerQuestion', title: 'Marks per Question', type: 'number', initialValue: 1 }),
    defineField({ name: 'negativeMarks', title: 'Negative Marks per Wrong Answer', type: 'number', initialValue: 0 }),
    defineField({
      name: 'questions',
      title: 'Questions',
      type: 'array',
      of: [{
        type: 'object',
        name: 'question',
        title: 'Question',
        fields: [
          defineField({ name: 'text', title: 'Question Text', type: 'text', validation: R => R.required() }),
          defineField({
            name: 'options',
            title: 'Options',
            type: 'array',
            of: [{ type: 'string' }],
            validation: R => R.min(2).max(6),
          }),
          defineField({ name: 'correctIndex', title: 'Correct Option Index (0-based)', type: 'number' }),
          defineField({ name: 'explanation', title: 'Explanation (shown after submission)', type: 'text' }),
        ],
        preview: { select: { title: 'text' } },
      }],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'eventSlug' },
  },
})
