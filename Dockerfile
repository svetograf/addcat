# Stage 1
FROM 2muchcoffee/node:16 as build-stage

COPY . /app

RUN yarn
RUN yarn build --configuration=production --output-path=./dist/out


# Stage 2
FROM nginx:1.15
COPY --from=build-stage /app/dist/out/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
