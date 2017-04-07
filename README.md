Introduction
------------

A Node.js DNS server that is configured using Redis. Optionally names not found in Redis
are looked up in Google's DNS server (8.8.8.8).


Installation
------------

Pre-requisite:

 * Node.js
 * Redis server

Make sure to setup DNS correctly on the hosts where you want to use this DNS
server. Check /etc/resolv.conf if you're running on unix. In Windows, check
the network settings in the control panel.

Install: `npm install --production`

Copy `config.json.template` to `config.json` and update with your settings.
Start the server: `npm start` or `yarn start`.

To use a different port, etc. either edit the config.json file or use and ENV.
For example to set the dns port to 6000 and then start the server run the following.

    export DNS_PORT=6000 && yarn start


Test the setup
--------------

Start with setting up some hosts with their IP's in Redis.
Make sure Redis is installed and running.

```
redis-cli set redis-dns:dbserver.redis-dns.local 10.0.0.1
redis-cli set redis-dns:appserver.redis-dns.local 10.0.0.2
```

You can use `dig` for testing purposes. This does not require that you change the
DNS of the machine you are using for the tests since you can use an alternate
port in dig.

Should give 10.0.0.1: `dig @localhost -p 5353 dbserver.redis-dns.local A`

Should give empty answer: `dig @localhost -p 5353 dbserverrrr.redis-dns.local A`

Should give empty answer: `dig @localhost -p 5353 dbserver.redis-dns.local MX`


Docker setup
-----------

Build the image: `docker build --rm -t redisdns .`

Start the container:

    docker run -d -p 5353 --name redisdns redisdns

Docker-compose setup
-----------

Build the image: `docker-compose build dns`

Start the container:

    docker-compose up -d
