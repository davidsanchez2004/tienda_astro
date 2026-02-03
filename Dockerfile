FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Build
RUN npm run build

# Instalar serve globalmente para servir la app
RUN npm install -g serve

# Exponer puerto
EXPOSE 3000

# Start
ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["node", "dist/server/entry.mjs"]
