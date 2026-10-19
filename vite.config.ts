import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * O dev server é acessado por um proxy público quando o jogo roda no preview.
 * Nesse caso as requisições chegam com Host/Origin do proxy, então liberamos
 * apenas esses hosts. Fora do preview nada muda: `allowedHosts` continua no
 * padrão do Vite.
 */
const previewMode = process.env.BASE44_PREVIEW_MODE === '1'
const previewHosts = previewMode
  ? [
      process.env.BASE44_SANDBOX_HOST_DOMAIN
        ? `.${process.env.BASE44_SANDBOX_HOST_DOMAIN}`
        : null,
      process.env.BASE44_PUBLIC_HOST_SUFFIX
        ? `3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`
        : null,
    ].filter((host): host is string => Boolean(host))
  : []

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    ...(previewHosts.length ? { allowedHosts: previewHosts } : {}),
  },
})
