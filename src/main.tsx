import React from 'react';
import App from './App.tsx'
import './index.css'
import {createRoot} from "react-dom/client";
import {PaginationProvider} from "./contexts/paginationProvider.tsx";
import {SnackbarProvider} from "./contexts/snackbarProvider.tsx";
import {Auth0Provider} from "@auth0/auth0-react";
import {AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_DOMAIN, AUTH0_SCOPE} from "./utils/auth0.ts";

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Auth0Provider
            domain={AUTH0_DOMAIN}
            clientId={AUTH0_CLIENT_ID}
            authorizationParams={{
                redirect_uri: window.location.origin,
                // El token es para nuestra API (su "aud") y pide los permisos
                // que revisan los servicios: Auth0 solo pone los que se piden
                // y que el usuario tiene por su rol.
                audience: AUTH0_AUDIENCE,
                scope: AUTH0_SCOPE,
            }}
            // Refresh tokens: la sesión se renueva sin depender de cookies de
            // terceros, que los navegadores bloquean. Se guardan en
            // localStorage para que la sesión sobreviva a recargar la página.
            // Costo: si alguien lograra meter código en la página, podría
            // leer el token.
            useRefreshTokens
            cacheLocation="localstorage"
        >
            <PaginationProvider>
                <SnackbarProvider>
                    <App/>
                </SnackbarProvider>
            </PaginationProvider>
        </Auth0Provider>
    </React.StrictMode>,
)
