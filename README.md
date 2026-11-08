# Printscript UI

This is a React project using Vite and Node.js 20. This README will guide you on how to set up and start the project locally.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed Node.js 20 or later
- You have installed npm

## Getting Started

To get a local copy up and running, follow these steps:

### 1. Fork this Repository in your github account

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/printscript-ui.git
```

###  3. Navigate to the Project Directory
```bash
cd printscript-ui
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the Development Server

```bash
npm run dev
```

This will start the Vite development server. You can now open your browser and navigate to http://localhost:5173/ to see the application running.

## Conexión con el backend (Snippet Searcher)

La UI le pide todo a `BACKEND_URL`, que por defecto es `/api`, relativa a la página: el navegador le suma la dirección de la UI (`http://localhost:5173/api` en local, `https://snippetsearcher-dev.duckdns.org/api` en dev). Así la misma imagen sirve en dev y en prod. Se puede pisar con la variable `BACKEND_URL` al compilar o al correr Cypress. Ahí atiende un **reverse proxy**: recibe cada pedido y se lo pasa al servicio que corresponde, sacando el `/api`.

| Ruta | Va a | Por defecto |
|---|---|---|
| `/api/permissions…` | Permission Service | `http://localhost:8081` |
| el resto de `/api…` | Snippet Service | `http://localhost:8080` |

- En local, el proxy es el de Vite (`server.proxy` en `vite.config.ts`). Funciona solo con `npm run dev`.
- Para usar otras direcciones, se definen `SNIPPET_SERVICE_URL` y `PERMISSION_SERVICE_URL` en un `.env` (no se commitea).
- En la VM, el proxy es nginx (ver el README de [SnippetSearcher-infra](https://github.com/MartinaCousido/SnippetSearcher-infra#reverse-proxy)).

El contrato completo está en [Contrato con la UI](https://github.com/MartinaCousido/SnippetSearcher#contrato-con-la-ui) de SnippetSearcher.

## Build production version

To use this UI in production you should use an optimized and static version, this command will generate this version in `dist` directory:  

```bash
npm run build
```

## Imagen Docker y deploy (Snippet Searcher)

El `Dockerfile` arma la imagen en dos etapas:

1. Compila la UI con Node 20 (`npm ci` y `npm run build`). No baja el programa de Cypress, que la imagen no usa.
2. Sirve la carpeta `dist/` con nginx, en el puerto 80 ([`nginx.conf`](nginx.conf)). Las rutas de React, como `/snippet/<id>`, responden `index.html`: así recargar la página no da 404.

`BACKEND_URL` queda en `/api`, y la misma imagen sirve en dev y en prod. Las variables de Auth0 llegan como `build-args` (ver [Auth0](#auth0-snippet-searcher)). Para probarla en tu máquina:

```bash
# Pasa las variables VITE_AUTH0_* del .env como build-args.
docker build -t snippet-ui $(grep '^VITE_' .env | sed 's/^/--build-arg /') .
# En el puerto 5173: es el único local que acepta el login de Auth0.
docker run --rm -p 5173:80 snippet-ui   # http://localhost:5173
```

En esa prueba, la UI no llega al backend: el proxy de `/api` es el de Vite, que solo existe con `npm run dev`.

En la VM, el `proxy` del stack le pasa `/` al servicio `ui` (ver [Reverse proxy](https://github.com/MartinaCousido/SnippetSearcher-infra#reverse-proxy) en el repo de infra).

### Ramas y deploy

Este repo usa `master` en lugar de `dev`:

```
<rama de la tarea>  ──PR──▶  master  ──PR──▶  main
                               │               │
                               ▼               ▼
                          VM de dev       VM de prod
```

- Cada tarea va en su propia rama, creada desde `master`, y entra con un PR (squash). Lo probado pasa a `main` con un PR `master` → `main` (merge commit).
- En cada push a `master` o `main`, `.github/workflows/cd.yml` publica la imagen en GHCR como `ghcr.io/martinacousido/snippet-ui`, con el tag del ambiente (`dev` o `prod`) y el del commit (`sha-…`). Después entra por SSH a la VM y corre `docker service update` solo de `ui`.
- Usa los secrets `VM_HOST`, `VM_USER` y `VM_SSH_KEY` de los *Environments* `dev` (solo `master`) y `prod` (solo `main`). La VM tiene que estar prendida.
- `master` y `main` están protegidas igual que en los otros repos: PR obligatorio y el check `build` en verde para mergear.

## Cypress

Los tests de la cátedra (`cypress/e2e/`) usan la página como lo haría un usuario. Inician sesión en la página real de Auth0, con un usuario de prueba, y corren contra el sistema levantado en local.

1. **Backend:** levantar el sistema completo desde SnippetSearcher (`docker compose -f docker-compose.sistema.yml up --build`, ver [Cómo levantarlo](https://github.com/MartinaCousido/SnippetSearcher#cómo-levantarlo)).
2. **Variables:** en el `.env` de este repo (ver [`.env.example`](.env.example)), además de las de Auth0:

   | Variable | Valor |
   |---|---|
   | `AUTH0_USERNAME` | `ana@example.com`: usuario de prueba con el rol `snippet-user` |
   | `AUTH0_PASSWORD` | La de `USUARIOS_PASSWORD` en `SnippetSearcher-infra/auth0/.env` |

3. **UI:** `npm run dev`.
4. **Tests:** `npm run cypress` (con ventana) o `npx cypress run` (en la terminal).

Cómo funciona el login:

- `cy.loginToAuth0` ([`cypress/support/e2e.ts`](cypress/support/e2e.ts)) entra por la página de Auth0 una sola vez y guarda la sesión con `cy.session`. Los tests siguientes la reusan.
- La sesión es válida si `auth0-react` tiene su token en `localStorage` (claves `@@auth0spajs@@…`).
- Los pedidos que un test hace directo al backend con `cy.request` llevan el token con `cy.authHeaders()`.
- La primera vez que un usuario entra desde `localhost`, Auth0 pide autorizar la app. Si Cypress se queda en esa pantalla, hay que entrar una vez a mano con ese usuario y aceptar.

"Can run snippets" falla hasta la US-10 (ejecución interactiva): el botón para ejecutar está comentado en la UI de la cátedra (`src/screens/SnippetDetail.tsx`).

Los tests dejan snippets creados en la base de `ana`. "Renders the first snippets" espera menos de 10 en la primera página: si se acumulan, hay que borrar algunos.

## Auth0 (Snippet Searcher)

La UI pide iniciar sesión con Auth0 y manda el token del usuario en cada pedido al backend. Las decisiones están en **Auth0** y **Roles y permisos** de [Decisiones técnicas](https://github.com/MartinaCousido/SnippetSearcher#decisiones-técnicas), y los recursos de Auth0 se crean en [SnippetSearcher-infra](https://github.com/MartinaCousido/SnippetSearcher-infra#auth0).

- **Sin sesión**, cualquier página lleva al login de Auth0 (`withAuthenticationRequired` en [`App.tsx`](src/App.tsx)).
- **El token** es para nuestra API (`audience` = `https://snippetsearcher-api`) y pide `read:snippets write:snippets` ([`main.tsx`](src/main.tsx)). `ApiSnippetOperations` lo agrega a cada pedido como `Authorization: Bearer …`.
- **La sesión** usa *refresh tokens* guardados en `localStorage`: sobrevive a recargar la página sin depender de cookies de terceros.
- **Errores:** si el backend responde 403 (falta el permiso, o no es el owner), se muestra "No tenés permiso para hacer esto".
- **Salir**, en la barra, cierra la sesión y vuelve al login.

Variables (ver [`.env.example`](.env.example)). Ninguna es secreta: el client id de una app SPA es público.

| Variable | Valor |
|---|---|
| `VITE_AUTH0_DOMAIN` | `dev-eadjutr73y1lgdc5.us.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | El client id de la app `snippetsearcher-ui` |
| `VITE_AUTH0_AUDIENCE` | `https://snippetsearcher-api` |

- **En local:** `cp .env.example .env` y `npm run dev`.
- **En la imagen:** Vite las escribe en el código al compilar. Llegan como `build-args` desde `cd.yml` (los `ARG` del `Dockerfile`). Hay un solo tenant, así que la misma imagen sirve en dev y prod.

Para entrar se usan los usuarios de prueba de Pulumi (`ana@example.com`, `leo@example.com`) o un usuario nuevo registrado desde el login, que recibe el rol solo.

## Start working

1. Fork the Project
2. Do your magic

## Contributing

1. Create your Feature Branch in this repo (git checkout -b feature/AmazingFeature)
2. Commit your Changes (git commit -m 'Add some AmazingFeature')
3. Push to the Branch (git push origin feature/AmazingFeature)
4. Open a Pull Request

## Tasks

- [ ] Integrate Auth0 UI and private routes
- [ ] Integrate your endpoints to the UI (Create custom "SnippetOperations")
- [ ] Dockerize
- [ ] CI/CD
- [ ] Sockets*