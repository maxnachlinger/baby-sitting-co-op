"use strict";
var net = require('net');
var multilevel = require('multilevel');
var level = require('level');
var sublevel = require('level-sublevel');
var VError = require('verror');
var config = require('../config');

module.exports = function() {
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
		if (err) throw new VError(err);

		// setup all the things here
	});
};
