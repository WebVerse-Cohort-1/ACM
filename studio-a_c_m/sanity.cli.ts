import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '9js05zdy',
    dataset: 'production'
  },
  deployment: {
    autoUpdates: true,
  },
  vite: (config: any) => ({
    ...config,
    define: {
      ...config.define,
      __BUNDLED_DEV__: true,
    },
  }),
})
