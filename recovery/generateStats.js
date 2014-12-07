"use strict";
var _ = require('lodash');
var VError = require('verror');
var joi = require('joi');

module.exports = function (params, cb) {
	var joiResult = joi.validate(params, {
		transactions: joi.array().includes(joi.any()).required()
	}, {convert: true, allowUnknown: true});

	if (joiResult.error)
		return setImmediate(cb.bind(this, new VError(joiResult.error.message)));

	var transactions = params.transactions;
	
	var totals = {};
	var initialStats = {
		points: 5, // everyone starts off with 5 points
		totalChildrenWatched: 0,
		receiversSatFor: {},
		amtReceiversSatFor: 0,
		maxConcurrentChildrenWatched: 0,
		maxDurationChildrenWatched: 0
	};

	_.each(transactions, function (t) {
		if (!totals[t.sittingProviderId])
			totals[t.sittingProviderId] = _.cloneDeep(initialStats);
		if (!totals[t.sittingReceiverId])
			totals[t.sittingReceiverId] = _.cloneDeep(initialStats);

		var provider = totals[t.sittingProviderId];

		// points = children * duration
		var points = t.childrenWatched * t.duration;
		provider.points += points;
		totals[t.sittingReceiverId].points -= points;

		if(provider.maxConcurrentChildrenWatched < t.childrenWatched)
			provider.maxConcurrentChildrenWatched = t.childrenWatched;

		if(provider.maxDurationChildrenWatched < t.duration)
			provider.maxDurationChildrenWatched = t.duration;

		provider.totalChildrenWatched += t.childrenWatched;

		// certain sitters naturally help certain parents
		if(_.isUndefined(provider.receiversSatFor[t.sittingReceiverId])) {
			provider.receiversSatFor[t.sittingReceiverId] = 0;
			provider.amtReceiversSatFor++;
		}

		provider.receiversSatFor[t.sittingReceiverId]++;
	});

	cb(null, _.map(totals, function(stats, id) {
		stats.id = '!stat' + id;
		return stats;
	}));
};
