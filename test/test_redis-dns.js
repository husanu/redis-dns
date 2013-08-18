/*jshint -W054, evil:true, devel:true, browser:true*/

//
// Unit tests 
//
// Run like this:
// >nodeunit test_redis-dns.js
//
// NOTE: THIS TESTS HAVE NOT BEEN COMPLETED, TESTING FROM COMMAND LINE WITH DIG

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/


// Unit test
//-------------------------------------------------------------------------------------------------
// Basic tests for redis-dns

exports['test_redis-dns'] = {

	setUp: function(done) {
		// setup here

		// setup finished
		done();
	},

	'testing redis-dns': function(test) {

		var redis        = require("redis"),
			redis_client = redis.createClient(),
			dns          = require('dns'),
			domain       = 'redis-dns.local',
			ip           = '123.456.789.012';

		// There should be X tests
		test.expect(1);

		// tests here
		redis_client.on("connect", function () {

			// first set the IP for the domain in redis
			redis_client.set("redis-dns:"+domain, ip, function(err, res) {
				redis_client.quit();

				// Now check if the expected answer
				dns.resolve4(domain, function (err, addresses) {
					if (err) {
						throw err;
					}

					test.equal(addresses[0], ip, 'logDebug');

					console.log('addresses: ' + JSON.stringify(addresses));

					// All tests performed
					test.done();

				});
			}.bind(this));
		}.bind(this));

		// redis error management
		redis_client.on("error", function (err) {
			console.log("Redis error: " + err);
		});
		
	}

};