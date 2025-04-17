
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
    // Optimize chunk size to avoid memory issues
    chunkSizeWarningLimit: 1000,
    // Use safer options for builds with large codebase
    minify: 'terser',
    terserOptions: {
      compress: {
        // Reduce memory usage during minification
        passes: 1,
        drop_console: true,
      }
    },
    rollupOptions: {
      output: {
        // Split chunks to reduce bundle size
        manualChunks: {
          vendor: [
            'react', 
            'react-dom', 
            'react-router-dom',
            '@tanstack/react-query',
            'zustand'
          ],
          arcgis: ['@arcgis/core'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast'
          ]
        }
      }
    }
  }
}));
