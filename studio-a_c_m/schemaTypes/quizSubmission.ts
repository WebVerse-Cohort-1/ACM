import { defineField, defineType, Rule } from 'sanity'

export const quizSubmission = defineType({
  name: 'quizSubmission',
  title: 'Quiz Submission',
  type: 'document',
  fields: [
    defineField({ 
      name: 'quiz', 
      title: 'Quiz Reference', 
      type: 'reference', 
      to: [{ type: 'quiz' }],
      validation: (R: Rule) => R.required() 
    }),
    defineField({ 
      name: 'participantId', 
      title: 'Participant ID (or Email)', 
      type: 'string', 
      validation: (R: Rule) => R.required() 
    }),
    defineField({
      name: 'answers',
      title: 'Answers',
      type: 'array',
      of: [{
        type: 'object',
        name: 'answer',
        fields: [
          defineField({ name: 'questionId', title: 'Question ID/Key', type: 'string' }),
          defineField({ name: 'selectedOptionIndex', title: 'Selected Option Index', type: 'number' }),
          defineField({ name: 'textAnswer', title: 'Text Answer (for subjective)', type: 'text' })
        ]
      }]
    }),
    defineField({
      name: 'score',
      title: 'Final Score',
      type: 'number',
      description: 'Calculated score or manual judge score'
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending Review', value: 'pending' },
          { title: 'Graded', value: 'graded' }
        ]
      },
      initialValue: 'pending'
    })
  ],
  preview: {
    select: { 
      title: 'participantId', 
      subtitle: 'quiz.title',
      score: 'score'
    },
    prepare(selection: any) {
      const { title, subtitle, score } = selection
      return {
        title: title,
        subtitle: `${subtitle} - Score: ${score !== undefined ? score : 'Pending'}`
      }
    }
  },
})
