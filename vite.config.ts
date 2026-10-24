import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const snippetService = env.SNIPPET_SERVICE_URL || 'http://localhost:8080'
  const permissionService = env.PERMISSION_SERVICE_URL || 'http://localhost:8081'
  // Saca el /api: los servicios exponen sus rutas sin ese prefijo.
  const withoutApi = (path: string) => path.replace(/^\/api/, '')
  return {
    // Reemplaza cada process.env.X de src/utils/constants.ts. Todas se
    // reemplazan siempre, aunque no estén definidas (quedan en undefined): en
    // el navegador process no existe. Las credenciales de Auth0 son solo de
    // Cypress y nunca entran al código de la UI.
    define: {
      'process.env.FRONTEND_URL': env.FRONTEND_URL ? JSON.stringify(env.FRONTEND_URL) : 'undefined',
      'process.env.BACKEND_URL': env.BACKEND_URL ? JSON.stringify(env.BACKEND_URL) : 'undefined',
      'process.env.AUTH0_USERNAME': 'undefined',
      'process.env.AUTH0_PASSWORD': 'undefined'
    },
    plugins: [react()],
    // Reverse proxy de desarrollo: la UI pide todo a /api y Vite le pasa cada
    // pedido al servicio que corresponde. Es la misma tabla que el nginx de la VM
    // (ver "Contrato con la UI" en el README de SnippetSearcher).
    server: {
      proxy: {
        '/api/permissions': { target: permissionService, changeOrigin: true, rewrite: withoutApi },
        '/api': { target: snippetService, changeOrigin: true, rewrite: withoutApi },
      },
    },
  }
})
