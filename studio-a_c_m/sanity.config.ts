import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {icons} from '@sanity/icons'

// Polyfill to prevent Vite client ReferenceError __BUNDLED_DEV__ is not defined
if (typeof window !== 'undefined') {
  (window as any).__BUNDLED_DEV__ = true;
}

export default defineConfig({
  name: 'default',
  title: 'ACM TSEC CRM',

  projectId: '9js05zdy',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S: any) =>
        S.list()
          .title('CRM Dashboard')
          .items([
            S.listItem()
              .title('About Info')
              .icon(icons.info || icons.document)
              .child(
                S.editor()
                  .id('about')
                  .schemaType('about')
                  .documentId('siteAbout')
                  .title('About Info')
              ),
            S.listItem()
              .title('Events')
              .icon(icons.calendar)
              .child(S.documentTypeList('event').title('All Events')),
            S.listItem()
              .title('Quizzes')
              .icon(icons.database)
              .child(S.documentTypeList('quiz').title('All Quizzes')),
            S.listItem()
              .title('Members')
              .icon(icons.users)
              .child(S.documentTypeList('member').title('All Members')),
            S.listItem()
              .title('Gallery Captures')
              .icon(icons.image || icons.document)
              .child(S.documentTypeList('gallery').title('All Captures')),
            S.listItem()
              .title('Event Registrations')
              .icon(icons.clipboard)
              .child(S.documentTypeList('registration').title('Event Registrations')),
            S.listItem()
              .title('Contact Messages')
              .icon(icons.envelope)
              .child(S.documentTypeList('message').title('Contact Messages')),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
