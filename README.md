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

La imagen se arma sin variables: `BACKEND_URL` queda en `/api`, y la misma imagen sirve en dev y en prod. Para probarla en tu máquina:

```bash
docker build -t snippet-ui .
docker run --rm -p 8090:80 snippet-ui   # http://localhost:8090
```

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

To start cypress, make sure that the UI is running and enter: 

```bash
npm run cypress
```

## Enable Auth0

This application uses https://www.npmjs.com/package/@auth0/auth0-react library for Auth0 integration, to enable it you need to change:
* Uncomment autologin in [App.tsx](src/App.tsx)
* Uncomment token retrieval for operations [queries.tsx](src/utils/queries.tsx) 
* Create a `.env` file with the required env vars:
```
VITE_AUTH0_DOMAIN=<domain>
VITE_AUTH0_CLIENT_ID=<client_id>
```

If you get 401 loop when getting token:
* Change application type in Auth0 to "Regular Web Application"
* In Application Settings > Credentials > "Authentication Method" select "None" 

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