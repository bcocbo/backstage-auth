# Stage 1 - Create yarn install skeleton layer 
FROM node:22-bookworm-slim as builder
# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    python3 \
    g++ \
    make \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar Backstage CLI globalmente
RUN npm install -g @backstage/create-app@0.7.7

# Crear una nueva aplicación Backstage
# (Esto es interactivo, así que necesitamos automatizarlo)
RUN echo "backstage-app" | npx @backstage/create-app@0.7.7 --skip-install

# Cambiar al directorio de la aplicación
WORKDIR /app/backstage-app
# Instalar dependencias
# RUN yarn add @testing-library/react@^16.0.0 react@^18.0.0 react-dom@^18.0.0
# Versiones fijas, copiadas de la imagen main-90ff573 que funciona (Backstage 1.46.0)
COPY docker/backstage-1.46/package.json ./package.json
COPY docker/backstage-1.46/yarn.lock ./yarn.lock
COPY docker/backstage-1.46/packages/app/package.json ./packages/app/package.json
COPY docker/backstage-1.46/packages/backend/package.json ./packages/backend/package.json
RUN yarn install --immutable --network-timeout 600000


# Copiar configuración personalizada y renombrarla como app-config.yaml
COPY app-config.yaml ./app-config.yaml
COPY app-config.production.yaml ./app-config.production.yaml
COPY catalog-info.yaml ./catalog-info.yaml
COPY /packages/app/src/App.tsx ./packages/app/src/App.tsx
COPY /packages/app/src/theme.ts ./packages/app/src/theme.ts
COPY /packages/app/src/components/Root/Root.tsx ./packages/app/src/components/Root/Root.tsx
COPY /packages/app/src/components/catalogoIa ./packages/app/src/components/catalogoIa
COPY /packages/backend/src/index.ts ./packages/backend/src/index.ts
COPY /examples ./examples

# Construir la aplicación

RUN yarn build:backend


# Production stage
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y \
    curl \
    git \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app && \
    groupadd -r backstage && \
    useradd -r -g backstage -d /app backstage && \
    chown backstage:backstage /app

WORKDIR /app
USER backstage


# Copiar TODA la aplicación construida (approach más seguro)
COPY --from=builder --chown=backstage:backstage /app/backstage-app ./

# DEBUG en runtime: Ver qué tenemos disponible
RUN echo "=== RUNTIME FILES ===" && \
    ls -la . && \
    ls -la packages/backend/ && \
    ls -la packages/app/ 2>/dev/null || echo "No dist directory found" && \
    echo "=== END RUNTIME FILES ==="



ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "yarn workspace backend start"]
 
#CMD ["sh", "-c", "node packages/backend/dist/index.js --config app-config.yaml & yarn workspace @backstage/app-default start"]
#CMD ["sh", "-c", "if yarn workspace backend start 2>/dev/null; then exit 0; elif yarn dev 2>/dev/null; then exit 0; elif node packages/backend/dist/index.js 2>/dev/null; then exit 0; else echo 'No suitable start command found' && yarn --help; fi"]
