FROM node:6-alpine
ENV NPM_CONFIG_LOGLEVEL warn
RUN mkdir -p /usr/src/app

EXPOSE 3000

WORKDIR /usr/src/app

ADD package.json /usr/src/app/

RUN apk add --update make gcc g++ python libc6-compat postgresql-dev bash && \
 yarn install --production && \
 apk del make gcc g++ python postgresql-dev && \
 rm -rf /tmp/* /var/cache/apk/* /root/.yarn /root/.node-gyp

ADD . /usr/src/app/

VOLUME [ "/usr/src/app" ]

ENTRYPOINT ["npm", "start"]
