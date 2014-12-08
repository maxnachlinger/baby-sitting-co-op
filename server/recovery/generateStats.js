var _ = require('lodash');
var VError = require('verror');
var joi = require('joi');
var async = require('async');

module.exports = function (params, cb) {
	var paramsErrors = paramsAreInvalid();
	if (paramsErrors)
		return setImmediate(cb.bind(this, new VError(paramsErrors)));

	var transactions = params.transactions;

	var stats = {
		members: [],
		productiveMembers: [],  // of {memberId: memberId, productivity: rank} ranked by productivity
		recommendedSitters: [] // of {memberId: memberId, recommendedSitters: [memberIds ranked by productivity]}
	};

	async.series([
		setupMembersStats,
		calcProductivity,
		calcParentRecommendations
	], function (err) {
		if (err) err = new VError(err);
		cb(err, stats);
	});

	function setupMembersStats(cb) {
		var statsMap = {};

		var setupStats = function (memberId) {
			return {
				memberId: memberId,
				points: 5, // everyone starts off with 5 points
				sittersUsed: {}, // {sitter-memberId -> amt times sitter-member sat this member's children}
				totalUniqueSittersUsed: 0,
				parentsSatFor: {}, // {parent-memberId -> amt of times this member sat parent-member's children}
				totalUniqueParentsSatFor: 0,
				lastSat: 0 // unix timestamp in milliseconds
			};
		};

		_.each(transactions, function (t) {
			// if either the parent or sitter has yet to be added, add them
			if (!statsMap[t.sitterId])
				statsMap[t.sitterId] = setupStats(t.sitterId);
			if (!statsMap[t.parentId])
				statsMap[t.parentId] = setupStats(t.parentId);

			var sitter = statsMap[t.sitterId];
			var parent = statsMap[t.parentId];

			// points = children * duration - sitter gains points, parent loses them
			var points = t.childrenWatched * t.duration;
			sitter.points += points;
			parent.points -= points;

			if (sitter.lastSat < t.startedAt)
				sitter.lastSat = t.startedAt;

			// parent: sitters used
			if (_.isUndefined(parent.sittersUsed[sitter.memberId])) {
				parent.sittersUsed[sitter.memberId] = 0;
				parent.totalUniqueSittersUsed++;
			}
			parent.sittersUsed[sitter.memberId]++;

			// sitter: parents sat for
			if (_.isUndefined(sitter.parentsSatFor[parent.memberId])) {
				sitter.parentsSatFor[parent.memberId] = 0;
				sitter.totalUniqueParentsSatFor++;
			}
			sitter.parentsSatFor[parent.memberId]++;
		});

		stats.members = _.values(statsMap);
		return cb();
	}

	// Sitter-productivity: totalUniqueParentsSatFor + points + (-10% per 30 days since sitter last sat).
	// Note: This is great, but we'll need a nightly job to recalculate this

	function calcProductivity(cb) {
		var thirtyDays = 30 * 24 * 60 * 60 * 1000;

		stats.members = _.map(stats.members, function (member) {
			var rank = 0;

			if (member.points) {
				var pointDecayPercentage = ((Date.now() - member.lastSat) / thirtyDays) * 10 / 100;
				rank = (member.points + member.totalUniqueParentsSatFor) * (1 - pointDecayPercentage);
				rank = rank < 0 ? 0 : rank;
			}

			member.productivityRanking = rank;
			return member;
		});

		stats.productiveMembers = _(stats.members)
			.sortBy('productivityRanking')
			.reverse()
			.map(_.partialRight(_.pick, 'memberId', 'productivityRanking'))
			.valueOf();

		cb();
	}

	// Parent sitter recommendation: Sitter productivity (see calcProductivity()) + 2 points per each time the sitter
	// has sat for the parent in question

	function calcParentRecommendations(cb) {
		stats.members = _.map(stats.members, function (member) {
			// default is to recommend the most productive members
			var sitters = _.cloneDeep(stats.productiveMembers); // we want a copy here as we're changing the productivityRanking

			if (member.totalUniqueSittersUsed) {
				sitters = _(sitters).map(function(sitter) {
					// parent has used sitter, add 1 point to the sitter per amount of time this parent used this sitter
					if(member.sittersUsed[sitter.memberId])
						sitter.productivityRanking += (member.sittersUsed[sitter.memberId] * 2);

					return sitter;
				})
					.sortBy('productivityRanking')
					.reverse()
					.valueOf();
			}

			member.recommendedSitters = _.pluck(sitters, 'memberId');
			return member;
		});

		stats.recommendedSitters = _.map(stats.members, _.partialRight(_.pick, 'memberId', 'recommendedSitters'));
		cb();
	}

	function paramsAreInvalid() {
		var joiResult = joi.validate(params, {
			transactions: joi.array().includes(
				joi.object().keys({
					_id: joi.number().required(),
					childrenWatched: joi.number().required(),
					duration: joi.number().required(),
					sitterId: joi.number().required(),
					parentId: joi.number().required(),
					startedAt: joi.number().required()
				})
			).required()
		}, {convert: true, allowUnknown: true});

		return joiResult.error && joiResult.error.message;
	}
};
