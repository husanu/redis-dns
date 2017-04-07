import redis from 'redis';

const redisClient = redis.createClient();

redisClient.on('error', err => {
    console.log(`Redis error: ${err}`);
});

module.exports = {
    setUp: done => {
        done();
    },
    redis: test => {
        const domain = 'redis-dns.local';
        const ip = '123.456.789.012';

        // There should be X tests
        test.expect(1);

        // First set the IP for the domain in redis
        redisClient.set(`redis-dns:${domain}`, ip, err => {
            if (err) {
                throw err;
            }
            redisClient.quit();

            test.equal(ip, ip, 'logDebug');
            test.done();
        });
    }
};
