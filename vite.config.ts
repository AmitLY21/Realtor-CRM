import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.svg', 'icons/*.png'],
      manifest: {
        name: 'Realtor CRM - ניהול נדל״ן מתקדם',
        short_name: 'RealtorCRM',
        description: 'CRM מתקדם ומהיר למתווכי נדל״ן בישראל - ניהול נכסים, לקוחות, התאמות וסגירת עסקאות',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        dir: 'rtl',
        lang: 'he',
        icons: [
          {
            src: '/icons/16x16.png',
            sizes: '16x16',
            type: 'image/png'
          },
          {
            src: '/icons/32x32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: '/icons/72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/120x120.png',
            sizes: '120x120',
            type: 'image/png'
          },
          {
            src: '/icons/128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/icons/180x180.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: '/icons/192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/icons/512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        share_target: {
          action: '/?share=1',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        }
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/dexie')) {
            return 'vendor-db'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons'
          }
        }
      }
    }
  }
})
