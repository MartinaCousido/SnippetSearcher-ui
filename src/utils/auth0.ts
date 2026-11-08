// Configuración de Auth0 (ver "Auth0" en Decisiones técnicas de SnippetSearcher).
// Vite reemplaza import.meta.env.VITE_* al compilar: en local salen del .env
// (ver .env.example) y en la imagen, de los ARG del Dockerfile. No son
// secretos: el client id de una app SPA es público.
export const AUTH0_DOMAIN: string = import.meta.env.VITE_AUTH0_DOMAIN ?? ""
export const AUTH0_CLIENT_ID: string = import.meta.env.VITE_AUTH0_CLIENT_ID ?? ""
export const AUTH0_AUDIENCE: string = import.meta.env.VITE_AUTH0_AUDIENCE ?? ""

// openid, profile y email: los datos del usuario que muestra la barra.
// read:snippets y write:snippets: los permisos que revisan los servicios.
export const AUTH0_SCOPE = "openid profile email read:snippets write:snippets"

if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_AUDIENCE) {
  console.error("Falta configurar Auth0: VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID y VITE_AUTH0_AUDIENCE (ver .env.example)")
}
