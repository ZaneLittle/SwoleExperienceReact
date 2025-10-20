import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@/components': resolve(__dirname, './components'),
      '@/app': resolve(__dirname, './app'),
      '@/lib': resolve(__dirname, './lib'),
      '@/hooks': resolve(__dirname, './hooks'),
      '@/contexts': resolve(__dirname, './contexts'),
      // React Native Web aliases
      'react-native': 'react-native-web',
      'react-native-svg': 'react-native-svg-web',
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      external: [],
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-native-web',
      'victory',
      'react-router-dom',
      'react-native-svg',
      'react-native-vector-icons',
    ],
    exclude: [],
  },
})
