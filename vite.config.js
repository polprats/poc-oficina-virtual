import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({ plugins: [vue()], build: { rolldownOptions: { output: { manualChunks(id) { if (id.includes('node_modules/phaser')) return 'phaser'; } } } } });
