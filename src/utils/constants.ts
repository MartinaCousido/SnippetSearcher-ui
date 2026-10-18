export const FRONTEND_URL = process?.env?.FRONTEND_URL ?? "http://localhost:5173"
// La UI le habla a un reverse proxy, no a cada servicio: en local es el de Vite
// (vite.config.ts), en la VM es nginx. Por eso BACKEND_URL es la dirección de la
// propia UI más /api.
export const BACKEND_URL = process?.env?.BACKEND_URL ?? `${FRONTEND_URL}/api`
export const AUTH0_USERNAME = process?.env?.AUTH0_USERNAME ?? ""
export const AUTH0_PASSWORD = process?.env?.AUTH0_PASSWORD ?? ""
