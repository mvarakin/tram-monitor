FROM nginx:1.31.6-alpine
COPY public/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8050
CMD ["nginx", "-g", "daemon off;"]