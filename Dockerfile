# syntax = docker/dockerfile:1

ARG BUILD_CONFIGURATION=production

FROM node:22-alpine AS build
WORKDIR /app

COPY package-lock.json package.json ./
RUN npm ci

COPY . .

ARG BUILD_CONFIGURATION
RUN npm run build -- --configuration=$BUILD_CONFIGURATION

FROM nginx:alpine

COPY --from=build /app/dist/chungus-battles-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
