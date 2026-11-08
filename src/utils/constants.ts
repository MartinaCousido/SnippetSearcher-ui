// Se escribe process.env.X, sin ?.: al compilar, Vite reemplaza ese texto
// exacto por su valor (ver define en vite.config.ts). En el navegador process
// no existe, así que si quedara sin reemplazar la página se rompería.
export const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173"
// La UI le habla a un reverse proxy, no a cada servicio: en local es el de Vite
// (vite.config.ts), en la VM es nginx. Por eso BACKEND_URL es /api, relativa a
// la página: el navegador le suma la dirección de la UI. Así la misma imagen
// sirve en dev y en prod, con HTTP o HTTPS.
export const BACKEND_URL = process.env.BACKEND_URL ?? "/api"
export const AUTH0_USERNAME = process.env.AUTH0_USERNAME ?? ""
export const AUTH0_PASSWORD = process.env.AUTH0_PASSWORD ?? ""
