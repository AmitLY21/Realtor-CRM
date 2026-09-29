import { build } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export async function runBuild() {
  console.log('🚀 Building Realtor CRM WhatsApp Web Companion extension...')

  const outDir = resolve(__dirname, 'dist')

  // Clean outDir
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true })
  }
  fs.mkdirSync(outDir, { recursive: true })

  // 1. Build WhatsApp Observer (IIFE Content Script - self contained, zero chunk dependencies)
  console.log('📦 Bundling whatsapp-observer.js (IIFE)...')
  await build({
    configFile: false,
    build: {
      lib: {
        entry: resolve(__dirname, 'src/whatsapp-observer.ts'),
        formats: ['iife'],
        name: 'WhatsAppObserver',
        fileName: () => 'whatsapp-observer.js',
      },
      outDir,
      emptyOutDir: false,
    },
  })

  // 2. Build CRM Bridge (IIFE Content Script - self contained)
  console.log('📦 Bundling crm-bridge.js (IIFE)...')
  await build({
    configFile: false,
    build: {
      lib: {
        entry: resolve(__dirname, 'src/crm-bridge.ts'),
        formats: ['iife'],
        name: 'CRMBridge',
        fileName: () => 'crm-bridge.js',
      },
      outDir,
      emptyOutDir: false,
    },
  })

  // 3. Build Background Service Worker (IIFE)
  console.log('📦 Bundling background.js (IIFE)...')
  await build({
    configFile: false,
    build: {
      lib: {
        entry: resolve(__dirname, 'src/background.ts'),
        formats: ['iife'],
        name: 'BackgroundWorker',
        fileName: () => 'background.js',
      },
      outDir,
      emptyOutDir: false,
    },
  })

  // 4. Build Popup HTML + TS
  console.log('📦 Bundling popup.html...')
  await build({
    configFile: false,
    base: './',
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'src/popup.html'),
        output: {
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
      outDir,
      emptyOutDir: false,
    },
  })

  // Move popup.html from dist/src/popup.html -> dist/popup.html
  const nestedPopup = resolve(outDir, 'src/popup.html')
  const targetPopup = resolve(outDir, 'popup.html')
  if (fs.existsSync(nestedPopup)) {
    let html = fs.readFileSync(nestedPopup, 'utf-8')
    html = html.replace(/\.\.\//g, './')
    fs.writeFileSync(targetPopup, html)
    fs.rmSync(resolve(outDir, 'src'), { recursive: true, force: true })
  }

  console.log('✅ Build completed successfully! Extension files ready in extension/dist/')
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBuild().catch((err) => {
    console.error('❌ Build failed:', err)
    process.exit(1)
  })
}
