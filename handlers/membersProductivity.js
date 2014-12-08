"use strict";
var _ = require('lodash');
var config = require('../common/config');
var JSONStream = require('JSONStream');

module.exports = function (request, reply) {
	request.getLevelConnection(function(err, db) {
		reply(
			db.sublevels[config.subLevels.productiveMembers]
				.createValueStream()
				.pipe(JSONStream.stringify())
		).type('application/json');
	});
};
