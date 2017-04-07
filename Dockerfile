FROM mhart/alpine-node:latest
MAINTAINER Jonas Colmsjö <jonas@gizur.com>

RUN npm install --global yarn

RUN apk --no-cache add tini git openssh-client \
    && apk --no-cache add --virtual devs tar curl

RUN mkdir /app

WORKDIR /app
ADD package.json .
ADD index.js .
ADD config.json .

RUN yarn install

EXPOSE 53

ENTRYPOINT ["/sbin/tini"]

CMD ["yarn", "start"]
