"use strict";
var Boom = require('boom');
var config = require('../common/config');

module.exports = function (request, reply) {
	var memberId = request.params.memberId;

	request.getLevelConnection(function(err, db) {
		db.sublevels[config.subLevels.recommendedSitters].get(memberId, function (err, value) {
			if (err) {
				if (err.notFound)
					return reply(Boom.notFound());

				return reply(err)
			}
			reply(value);
		});
	});
};
