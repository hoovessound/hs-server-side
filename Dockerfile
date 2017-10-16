FROM node

WORKDIR /app

COPY package.json .

FROM ruby

RUN sudo gem install sass --no-user-install

RUN sass -v

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "npm", "start" ]