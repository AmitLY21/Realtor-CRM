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
      includeAssets: ['logo.svg'],
      manifest: {
        name: 'Realtor CRM - ניהול נדל״ן מתקדם',
        short_name: 'RealtorCRM',
        description: 'CRM מתקדם ומהיר למתווכי נדל״ן בישראל - ניהול נכסים, לקוחות, התאמות וסגירת עסקאות',
        theme_color: '#090d16',
        background_color: '#090d16',
        display: 'standalone',
        orientation: 'portrait-primary',
        dir: 'rtl',
        lang: 'he',
        icons: [
          {
            src: '/logo.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
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
  }
})
