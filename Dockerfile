FROM node

WORKDIR /app

COPY package.json .

RUN apt-get update && apt-get install -y vim git sudo

RUN sudo npm install yarn -g

RUN yarn install --production

RUN apt-get install -y imagemagick libmagickcore-dev libmagickwand-dev

RUN sudo curl -L https://yt-dl.org/downloads/latest/youtube-dl -o /usr/local/bin/youtube-dl
RUN sudo chmod a+rx /usr/local/bin/youtube-dl

RUN apt-get clean

COPY . .

EXPOSE 3000 8443

CMD [ "npm", "start" ]