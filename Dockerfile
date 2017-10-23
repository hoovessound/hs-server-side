FROM node

WORKDIR /app

COPY package.json .

RUN npm install --production

RUN apt-get install imagemagick libmagickcore-dev libmagickwand-dev
RUN apt-get clean

COPY . .

EXPOSE 3000 8443

CMD [ "npm", "start" ]