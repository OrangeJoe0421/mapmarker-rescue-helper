
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
  optimizeDeps: {
    include: [],
    exclude: []
  },
  build: {
    chunkSizeWarningLimit: 1500,
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
      format: {
        comments: false
      }
    },
    cssCodeSplit: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          // UI Component libraries
          if (id.includes('@radix-ui/')) {
            if (id.includes('react-dialog') || id.includes('react-dropdown-menu')) {
              return 'ui-core';
            }
            if (id.includes('react-tabs') || id.includes('react-toast')) {
              return 'ui-navigation';
            }
            return 'ui-other';
          }
          
          // React and major dependencies
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react';
          }
          
          if (id.includes('react-router-dom')) return 'router';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('zustand')) return 'store';
          
          // Google Maps
          if (id.includes('@react-google-maps/api')) return 'google-maps';
          
          // Return undefined for default chunking behavior
          return undefined;
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
}));
