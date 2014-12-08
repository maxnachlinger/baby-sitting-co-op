"use strict";
var _ = require('lodash');
var Boom = require('boom');
var config = require('../common/config');

module.exports = function (request, reply) {
	var memberId = request.params.memberId;
	var facet = request.params.facet;

	request.getLevelConnection(function(err, db) {
		db.sublevels[config.subLevels.members].get(memberId, function (err, value) {
			if (err) {
				if (err.notFound)
					return reply(Boom.notFound());

				return reply(err)
			}
			if(facet)
				reply(value[facet]);

			reply(value);
		});
	});
};
