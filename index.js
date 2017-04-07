#!/usr/bin/env node

import path from 'path';
import dnsd from 'dnsd';
import nconf from 'nconf';
import redis from 'redis';
import dns from 'native-dns';

nconf.use('file', {
    file: path.join(__dirname, 'config.json')
}).defaults({
    redis: {
        host: '127.0.0.1',
        port: 6379
    },
    dns: {
        port: 5353
    }
}).env({
    separator: '_',
    lowerCase: true,
    whitelist: [
        'DNS_INTERFACE',
        'DNS_PORT',
        'DNS_ZONE',
        'REDIS_HOST',
        'REDIS_PORT',
        'LOGS_LEVEL'
    ]
});

const keysToLowerCase = obj => {
    if (!typeof obj === 'object' || typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        return obj;
    }
    const keys = Object.keys(obj);
    let n = keys.length;
    let lowKey;
    while (n--) {
        const key = keys[n];
        if (key === (lowKey = key.toLowerCase())) {
            continue;
        }
        // This merges the uppercase obj with the lowercase
        // The uppercase is applied on top
        // e.g. This allows for ENV vars to be last
        if (typeof obj[lowKey] === 'object') {
            obj[lowKey] = Object.assign(obj[lowKey], keysToLowerCase(obj[key]));
        } else {
            obj[lowKey] = keysToLowerCase(obj[key]);
        }
        delete obj[key];
    }
    return (obj);
};

const config = {
    dns: keysToLowerCase(nconf.get()).dns,
    redis: keysToLowerCase(nconf.get()).redis
};

const redisClient = redis.createClient(config.redis.port, config.redis.host).on('error', err => {
    console.error('Redis error', err);
});

const server = dnsd.createServer((req, res) => {
    const question = res.question[0];
    const hostname = question.name;
    const ttl = Math.floor(Math.random() * 3600);

    let answer = {};

    if (question.type === 'A') {
        // First get the IP for the domain in redis
        redisClient.get(`redis-dns:${hostname}`, (redisErr, redisRes) => {
            if (redisErr) {
                console.info(`Redis error: ${redisErr}`);
            }
            if (redisRes !== null && redisRes.length > 0) {
                answer = {
                    name: hostname,
                    type: 'A',
                    data: redisRes,
                    ttl
                };

                res.answer.push(answer);
                console.info('%s:%s/%s question:%j answer:%j', req.connection.remoteAddress, req.connection.remotePort, req.connection.type, question, answer);
                res.end();
            } else {
                /* No match in Redis, try to lookup using the google server */
                const nativeQuestion = new dns.Question({
                    name: question.name,
                    type: 'A'
                });

                const start = Date.now();

                const nativeReq = new dns.Request({
                    question: nativeQuestion,
                    server: {
                        address: '8.8.8.8',
                        port: 53,
                        type: 'udp'
                    },
                    timeout: 1000
                });

                nativeReq.on('timeout', () => {
                    console.log('native-dns: Timeout in making request');
                });

                nativeReq.on('message', (err, answer) => {
                    if (err) {
                        console.error(err);
                    }
                    answer.answer.forEach(a => {
                        answer = {
                            name: hostname,
                            type: 'A',
                            data: a.address,
                            ttl
                        };

                        res.answer.push(answer);
                    });
                });

                nativeReq.on('end', () => {
                    const delta = (Date.now()) - start;
                    console.info(`Finished processing request: ${delta.toString()}ms`);
                    console.info('%s:%s/%s question:%j answer:%j', req.connection.remoteAddress, req.connection.remotePort, req.connection.type, question, res.answer);
                    res.end();
                });

                nativeReq.send();
            }
        });
    } else {
        res.end();
    }
});

console.log(`Server running at ${config.dns.interface}:${config.dns.port}`);
server.zone(config.dns.zone, 'ns1.' + config.dns.zone, 'us@' + config.dns.zone, 'now', '2h', '30m', '2w', '10m').listen(config.dns.port, config.dns.interface);

process.on('exit', () => {
    console.info('Shutting down DNS server.');
    console.info('Closing Redis connection.');
    redisClient.quit();
});
