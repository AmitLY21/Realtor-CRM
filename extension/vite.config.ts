import { defineConfig } from 'vite'
import { resolve } from 'path'
import { runBuild } from './build'

let isBuilding = false

export default defineConfig({
  plugins: [
    {
      name: 'extension-builder-plugin',
      apply: 'build',
      async buildStart() {
        if (!isBuilding && !process.env.VITE_SUB_BUILD) {
          isBuilding = true
          process.env.VITE_SUB_BUILD = 'true'
          try {
            await runBuild()
            process.exit(0)
          } catch (err) {
            console.error('Build failed:', err)
            process.exit(1)
          }
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        'whatsapp-observer': resolve(__dirname, 'src/whatsapp-observer.ts'),
        'crm-bridge': resolve(__dirname, 'src/crm-bridge.ts'),
        'background': resolve(__dirname, 'src/background.ts'),
        popup: resolve(__dirname, 'src/popup.html'),
      },
    },
  },
})
