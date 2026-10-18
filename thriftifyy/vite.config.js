
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },

server: {
  proxy: {
    // Stripe routes must keep the /api prefix
    '/api/stripe': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },

    // Other API routes remove the /api prefix
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },

    '/uploads': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
},

});
