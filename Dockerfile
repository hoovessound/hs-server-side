FROM node

WORKDIR /app

COPY package.json .

RUN npm install --production

RUN apt-get install imagemagick libmagickcore-dev libmagickwand-dev

# Must have packages
RUN apt-get update && apt-get install -y vim nano zsh curl git sudo

RUN apt-get clean

COPY . .

EXPOSE 3000 8443

CMD [ "npm", "start" ]