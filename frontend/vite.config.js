import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@/shared/styles/_variables" as *;
          @use "@/shared/styles/_mixins" as *;
        `,
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: {
      usePolling: true,
      // Reduce polling interval to save memory
      interval: 1000,
      // Ignore unnecessary directories
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**']
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      clientPort: 5173,
    },
    proxy: {
      '/api': {
        target: process.env.DOCKER_ENV ? 'http://backend:3000' : 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
});
