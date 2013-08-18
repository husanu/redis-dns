
Installation
------------

Pre-requisite:

 * NodeJs
 * Redis server

Make sure to setup DNS correctly on the hosts where you want to use this DNS server. Check /etc/resolv.conf if you're running on unix. In windows, check the network settings in the control panel.

Install: `npm install --production`

Copy `redis-dns.json.template` to `redis-dns.json` and update with your settings. 
Start the server: `node server.js`


Test the setup
--------------

Start with setting up some hosts with their IP:s in redis (make sure redis is installed an running)

```
redis-cli set redis-dns:dbserver.redis-dns.local 10.0.0.1
redis-cli set redis-dns:appserver.redis-dns.local 10.0.0.2
```

We can use `dig` for testing purposes. This does not require that we change the DNS of the machine we
are using for the tests since we can use an alternate port in dig.

Should give 10.0.0.1: `dig @localhost -p 5353 dbserver.redis-dns.local A`

Should give empty answer: `dig @localhost -p 5353 dbserverrrr.redis-dns.local A`

Should give empty answer: `dig @localhost -p 5353 dbserver.redis-dns.local MX`




