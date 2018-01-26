FROM node:6-alpine
ENV NPM_CONFIG_LOGLEVEL warn
RUN mkdir -p /usr/src/app

EXPOSE 3000

WORKDIR /usr/src/app

ADD package.json /usr/src/app/
RUN apt-get update && \
apt-get install -y postgresql 

RUN npm install --production

ADD . /usr/src/app/

VOLUME [ "/usr/src/app" ]

ENTRYPOINT ["npm", "start"]
