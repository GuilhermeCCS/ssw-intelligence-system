FROM node:22-alpine AS build

WORKDIR /app

ARG API_URL
ARG VITE_MP_PUBLIC_KEY
ARG VITE_GOOGLE_CLIENT_ID

ENV API_URL=${API_URL} \
    VITE_MP_PUBLIC_KEY=${VITE_MP_PUBLIC_KEY} \
    VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . ./
RUN npm run build \
    && mkdir /site \
    && cp -R index.html precos public sites src termos _redirects /site/

FROM nginx:alpine

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --spider http://127.0.0.1/ || exit 1
