# Etapa 1: compila la UI con Node. Queda una carpeta dist/ con archivos
# estáticos (HTML, JS y CSS).
FROM node:20-alpine AS build
WORKDIR /app

# Cypress está en las dependencias, pero la imagen no corre tests: no se baja
# su programa, que pesa más de 500 MB.
ENV CYPRESS_INSTALL_BINARY=0

# Primero solo los archivos de dependencias, para cachear el npm ci.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
# Sin variables: BACKEND_URL queda en /api, relativa a la página, así que la
# misma imagen sirve en dev y en prod.
RUN npm run build

# Etapa 2: imagen final, solo con nginx y los archivos compilados.
FROM nginx:1.30-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# El proxy del stack le pasa / a este puerto (ver SnippetSearcher-infra).
EXPOSE 80
