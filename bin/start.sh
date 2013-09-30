#!/bin/bash
sudo sh -c 'node server.js > /var/log/redis-dns.log 2>&1 &'
