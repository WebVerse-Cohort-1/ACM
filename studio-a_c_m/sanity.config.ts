import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {UsersIcon, CalendarIcon, ClipboardIcon} from '@sanity/icons'

export default defineConfig({
  name: 'default',
  title: 'ACM TSEC CRM',

  projectId: '9js05zdy',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('CRM Dashboard')
          .items([
            S.listItem()
              .title('Members')
              .icon(UsersIcon)
              .child(S.documentTypeList('member').title('All Members')),
            S.listItem()
              .title('Events / Quizzes')
              .icon(CalendarIcon)
              .child(S.documentTypeList('quiz').title('All Events')),
            S.listItem()
              .title('Registrations')
              .icon(ClipboardIcon)
              .child(S.documentTypeList('registration').title('Event Registrations')),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
