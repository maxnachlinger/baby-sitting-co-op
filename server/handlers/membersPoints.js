"use strict";
var _ = require('lodash');
var config = require('../common/config');
var JSONStream = require('JSONStream');
var through2 = require('through2');

module.exports = function (request, reply) {
	request.getLevelConnection(function(err, db) {
		reply(
			db.sublevels[config.subLevels.members]
				.createValueStream()
				.pipe(through2.obj(function (chunk, enc, tCb) {
					this.push(_.pick(chunk, 'memberId', 'points'));
					tCb();
				}))
				.pipe(JSONStream.stringify())
		).type('application/json');
	});
};
