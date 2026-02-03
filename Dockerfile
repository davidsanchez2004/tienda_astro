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

# Exponer puerto
EXPOSE 3000

# Start - Usar las variables de entorno correctas
CMD ["node", "--experimental-detect-module-unhandled-rejections", "dist/server/entry.mjs"]
