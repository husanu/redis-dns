#!/usr/bin/env node

import path from 'path';
import util from 'util'
import dnsd from 'dnsd';
import nconf from 'nconf';
import redis from 'redis';
import dns from 'native-dns';;

nconf.use('file', {
    file: path.join(__dirname, 'config.json')
});
nconf.load();

const config = {
    dns: nconf.get('dns'),
    redis: nconf.get('redis')
};

const server = dnsd.createServer(function(req, res) {
    const question = res.question[0];
    const hostname = question.name;
    const length = hostname.length;
    const ttl = Math.floor(Math.random() * 3600);
    const redisClient = redis.createClient(config.redis.port, config.redis.host);

    let answer = {};

    if(question.type === 'A') {
        redisClient.on('connect', function () {

            // first set the IP for the domain in redis
            redisClient.get(`redis-dns:${hostname}`, function(redis_err, redis_res) {
                if (redis_err) {
                    console.log('Redis error:'+redis_err);
                } else {
                    if(redis_res !== null && redis_res.length > 0) {
                        answer = {
                            name: hostname,
                            type: 'A',
                            data: redis_res,
                            ttl
                        };

                        res.answer.push(answer);

                        redisClient.quit();
                        console.info('%s:%s/%s question:%j answer:%j', req.connection.remoteAddress, req.connection.remotePort, req.connection.type, question, answer);
                        res.end();
                    } else {

                        /* No match in Redis, try to lookup using the google server */
                        var nativeQuestion = dns.Question({
                            name: question.name,
                            type: 'A'
                        });

                        var start = Date.now();

                        var nativeReq = dns.Request({
                            question: nativeQuestion,
                            server: {
                                address: '8.8.8.8',
                                port: 53,
                                type: 'udp'
                            },
                            timeout: 1000
                        });

                        nativeReq.on('timeout', function () {
                            console.log('native-dns: Timeout in making request');
                        });

                        nativeReq.on('message', function (err, answer) {
                            answer.answer.forEach(function(a) {
                                answer = {
                                    name: hostname,
                                    type: 'A',
                                    data: a.address,
                                    ttl
                                };

                                res.answer.push(answer);
                            });
                        });

                        nativeReq.on('end', function() {
                            var delta = (Date.now()) - start;
                            console.info(`Finished processing request: ${delta.toString()}ms`);

                            redisClient.quit();
                            console.info('%s:%s/%s question:%j answer:%j', req.connection.remoteAddress, req.connection.remotePort, req.connection.type, question, res.answer);
                            res.end();
                        });

                        nativeReq.send();
                    }
                }
            }.bind(this));
        }.bind(this));

        // redis error management
        redisClient.on('error', function(err) {
            console.error('Redis error', err);
        });

    } else {
        res.end();
    }
});

console.log(`Server running at ${config.dns.interface}:${config.dns.port}`);
server.zone(config.dns.zone, 'ns1.' + config.dns.zone, 'us@' + config.dns.zone, 'now', '2h', '30m', '2w', '10m').listen(config.dns.port, config.dns.interface);
