"use strict";
var domain = require('domain');
var net = require('net');
var multilevel = require('multilevel');
var level = require('level');
var sublevel = require('level-sublevel');
var config = require('../config');

var serverDomain = domain.create();
serverDomain.on('error', function (err) {
	console.error(err && err.stack);
	process.exit(1);
});
serverDomain.run(startup);

function startup() {
	var db = sublevel(level(config.dbPath, {
		createIfMissing: true,
		errorIfExists: false,
		valueEncoding: 'json'
	}));
	var transactionsLevel = db.sublevel(config.subLevels.transactions);
	var statsLevel = db.sublevel(config.subLevels.stats);

	net.createServer(function (con) {
		con.pipe(multilevel.server(db)).pipe(con);
	}).listen(config.levelPort, function (err) {
		if (err) throw err;
		require('./server');
	});
}
