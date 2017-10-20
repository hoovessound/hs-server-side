FROM node

WORKDIR /app

COPY package.json .

RUN npm install --production

RUN apt-get install imagemagick libmagickcore-dev libmagickwand-dev
RUN apt-get clean

RUN apt-get update && sudo apt-get upgrade
RUN apt-get install software-properties-common
RUN add-apt-repository ppa:certbot/certbot
RUN apt-get update
RUN apt-get install certbot
certbot certonly --standalone -d hoovessound.ml -d www.hoovessound.ml

COPY . .

EXPOSE 8080 8443

CMD [ "npm", "start" ]