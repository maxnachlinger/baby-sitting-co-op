"use strict";
var net = require('net');
var VError = require('verror');
var _ = require('lodash');
var async = require('async');
var multilevel = require('multilevel');
var config = require('../../config');
var manifest = require('../manifest.json');
var JSONStream = require('JSONStream');

module.exports = function (request, reply) {
	var db = multilevel.client(manifest);
	var dbSocket = net.createConnection(config.levelPort);
	dbSocket.pipe(db.createRpcStream()).pipe(dbSocket);

	reply(
		db.sublevels[config.subLevels.stats]
			.createValueStream({gt: '!stat'})
			.pipe(JSONStream.stringify())
	).type('application/json');
};
