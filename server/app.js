"use strict";
var path = require('path');
var net = require('net');
var multilevel = require('multilevel');
var level = require('level');
var sublevel = require('level-sublevel');
var config = require('../config');

var db = sublevel(level(config.dbPath, {
	createIfMissing: true,
	errorIfExists: false,
	valueEncoding: 'json'
}));

db.sublevel(config.subLevels.transactions);
db.sublevel(config.subLevels.stats);
multilevel.writeManifest(db, path.join(__dirname, '/manifest.json'));

net.createServer(function (con) {
	con.pipe(multilevel.server(db)).pipe(con);
}).listen(config.levelPort, function (err) {
	if (err) throw err;
	require('./server');
});
