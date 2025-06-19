FROM node:18-alpine AS builder

WORKDIR /app
COPY . .

RUN npm install && npm run build



FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
