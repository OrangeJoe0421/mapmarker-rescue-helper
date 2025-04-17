
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Even more aggressive memory usage optimizations
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 1,
        drop_console: true,
        drop_debugger: true
      },
      mangle: {
        safari10: true
      },
      // Use less memory-intensive but still effective options
      format: {
        comments: false
      }
    },
    // Further optimize CSS processing
    cssCodeSplit: true,
    // Disable source maps for production build to save memory
    sourcemap: false,
    // Aggressively reduce bundle size
    rollupOptions: {
      output: {
        // More granular chunk splitting to avoid large chunks
        manualChunks: {
          vendor: [
            'react', 
            'react-dom'
          ],
          router: ['react-router-dom'],
          state: ['zustand'],
          data: ['@tanstack/react-query'],
          arcgis: ['@arcgis/core'],
          ui1: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu'
          ],
          ui2: [
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast'
          ],
          ui3: [
            '@radix-ui/react-accordion',
            '@radix-ui/react-checkbox'
          ]
        },
        // Optimize chunk size
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
}));
