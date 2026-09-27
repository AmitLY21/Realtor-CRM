/**
 * Client-Side Image Compression Utility
 * Resizes smartphone photos (5-10MB) to max 1600px and converts to WebP (~150KB)
 * to keep IndexedDB and network payloads ultra-fast and within browser quotas.
 */

export async function compressImage(file: File, maxDimension = 1600, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // WebP output
        const dataUrl = canvas.toDataURL('image/webp', quality)
        resolve(dataUrl)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Storage persistence helper to prevent browser cache eviction on iOS Safari
 */
export async function ensureStoragePersistence(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persisted()
    if (!isPersisted) {
      return await navigator.storage.persist()
    }
    return true
  }
  return false
}
