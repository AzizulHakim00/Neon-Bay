import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/neon-bay-v1.8.0-engine.[hash].js',
        chunkFileNames: 'assets/neon-bay-v1.8.0-[name].[hash].js',
        assetFileNames(assetInfo) {
          const originalName = assetInfo.names?.[0] || assetInfo.name || 'asset';
          if (originalName.endsWith('.css')) {
            return 'assets/neon-bay-v1.8.0-styles.[hash][extname]';
          }
          return 'assets/neon-bay-v1.8.0-[name].[hash][extname]';
        },
      },
    },
  },
});
