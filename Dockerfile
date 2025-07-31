FROM node:20-alpine

WORKDIR /app
COPY . .
RUN cd labsalud_frontend && npm install && npm run build

EXPOSE 5173
CMD ["npm", "run", "preview"]

