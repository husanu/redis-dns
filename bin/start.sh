#!/bin/bash
cd /usr/lib/node_modules/redis-dns
sudo sh -c 'node server.js > /var/log/redis-dns.log 2>&1 &'
