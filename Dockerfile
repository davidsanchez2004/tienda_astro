FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Argumentos de build para variables de entorno
ARG GMAIL_USER
ARG GMAIL_PASSWORD
ARG ADMIN_EMAIL

# Establecer variables de entorno para el build
ENV GMAIL_USER=$GMAIL_USER
ENV GMAIL_PASSWORD=$GMAIL_PASSWORD
ENV ADMIN_EMAIL=$ADMIN_EMAIL

# Build con las variables de entorno
RUN npm run build

# Exponer puerto
EXPOSE 4321

# Variables de entorno para runtime
ENV HOST=0.0.0.0
ENV PORT=4321

# Start
CMD ["node", "dist/server/entry.mjs"]
