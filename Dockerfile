FROM node:18

RUN apt update && apt install nano mc -y

WORKDIR /var/www/app/

COPY . /var/www/app/

RUN npm install
RUN npm install pm2@latest -g

CMD [ "pm2-runtime", "start", "app.config.js" ]
