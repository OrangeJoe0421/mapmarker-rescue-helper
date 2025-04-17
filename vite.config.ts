
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
      // Add explicit alias for ArcGIS dependencies
      "@arcgis/core": path.resolve(__dirname, "./node_modules/@arcgis/core"),
    },
    // Preserve for proper esm handling
    mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
    // Ensure all file extensions are properly handled
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  optimizeDeps: {
    // Force inclusion of ArcGIS core and its sub-dependencies
    include: [
      '@arcgis/core/Map',
      '@arcgis/core/views/MapView',
      '@arcgis/core/layers/GraphicsLayer',
      '@arcgis/core/Graphic',
      '@arcgis/core/geometry/Point',
      '@arcgis/core/geometry/Polyline',
      '@arcgis/core/rest/support/RouteParameters',
      '@arcgis/core/rest/support/FeatureSet',
      '@arcgis/core/rest/route'
    ],
    // Exclude certain problematic packages from optimization
    exclude: []
  },
  build: {
    // Increase memory limits for build
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
    // Set a reasonable max chunk size
    assetsInlineLimit: 4096,
    rollupOptions: {
      // External modules that should not be bundled
      external: [],
      output: {
        // More targeted chunk splitting to handle ArcGIS size
        manualChunks: (id) => {
          // ArcGIS modules go to their own chunks
          if (id.includes('@arcgis/core')) {
            if (id.includes('/views/')) return 'arcgis-views';
            if (id.includes('/geometry/')) return 'arcgis-geometry';
            if (id.includes('/layers/')) return 'arcgis-layers';
            if (id.includes('/rest/')) return 'arcgis-rest';
            if (id.includes('/widgets/')) return 'arcgis-widgets';
            return 'arcgis-core';
          }
          
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
