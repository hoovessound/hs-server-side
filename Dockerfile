FROM node

WORKDIR /app

COPY package.json .

RUN npm install --production

RUN apt-get install imagemagick libmagickcore-dev libmagickwand-dev

# Must have packages
RUN apt-get update && apt-get install -y vim curl git sudo

RUN sudo curl -L https://yt-dl.org/downloads/latest/youtube-dl -o /usr/local/bin/youtube-dl
RUN sudo chmod a+rx /usr/local/bin/youtube-dl

RUN apt-get clean

COPY . .

EXPOSE 3000 8443

CMD [ "npm", "start" ]