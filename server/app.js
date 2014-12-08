"use strict";
var path = require('path');
var net = require('net');
var domain = require('domain');
var _ = require('lodash');
var multilevel = require('multilevel');
var level = require('level');
var sublevel = require('level-sublevel');
var config = require('./common/config');

var serverDomain = domain.create();

serverDomain.on('error', function (err) {
	console.error(err && err.stack);
	process.exit(1);
});

serverDomain.run(function() {
	var db = sublevel(level(config.dbPath, {
		createIfMissing: true,
		errorIfExists: false,
		valueEncoding: 'json'
	}));

	// setup sublevels
	var sublevels = {};
	_(config.subLevels).each(function(sublevelName) {
		sublevels[sublevelName] = db.sublevel(sublevelName);
	});

	multilevel.writeManifest(db, path.join(__dirname, '/manifest.json'));

	net.createServer(function (con) {
		con.pipe(multilevel.server(db)).pipe(con);
	}).listen(config.levelPort, function (err) {
		if (err) throw err;
		require('./server');
	});
});
