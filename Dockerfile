FROM golang:1.26 AS backend-builder

WORKDIR /src/backend

COPY backend/go.mod ./
COPY backend/cmd ./cmd
COPY backend/internal ./internal

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/api ./cmd/api

FROM node:22-alpine AS frontend-builder

WORKDIR /src/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/index.html ./
COPY frontend/tsconfig.json ./
COPY frontend/tsconfig.app.json ./
COPY frontend/tsconfig.node.json ./
COPY frontend/vite.config.ts ./
COPY frontend/src ./src

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache gettext

WORKDIR /app

COPY --from=backend-builder /out/api /app/api
COPY --from=frontend-builder /src/frontend/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

ENV PORT=8080
ENV BACKEND_PORT=8081

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
