import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Redireciona todas as requisições que começam com /v1/api (PostgreSQL API)
      '/v1/api': {
        target: 'https://api-postgresql-kr87.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('PostgreSQL API Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('PostgreSQL API Proxying:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('PostgreSQL API Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      },
      // Redireciona todas as requisições que começam com /api (MongoDB API)
      '/api': {
        target: 'https://api-mongodb-o0hu.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('MongoDB API Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('MongoDB API Proxying:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('MongoDB API Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})