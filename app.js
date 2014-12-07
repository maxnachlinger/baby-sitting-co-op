var domain = require('domain');
var server = require('./server');

var serverDomain = domain.create();
serverDomain.on('error', function(err) {
	console.error(err && err.stack);
	process.exit(1);
});
serverDomain.run(server);
