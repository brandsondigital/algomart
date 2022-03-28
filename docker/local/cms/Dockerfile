FROM node:16-alpine

RUN apk add --no-cache libc6-compat python2 make g++
RUN npm config set python python2
WORKDIR /app
COPY docker/local/cms/run.sh ./
COPY apps/cms/ ./
RUN npm install directus --global

CMD ["./run.sh"]
