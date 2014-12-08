var util = require('util');
var _ = require('lodash');
var async = require('async');
var test = require('tape');
var generateStats = require('../recovery/generateStats');

test('Errors on bad input.', function (t) {
	var inputs = [null, '', {}, {transactions: []}, {transactions: [{name: 'test'}]}];
	async.each(inputs, function (input, eCb) {
		generateStats(null, function (err, result) {
			t.ok(err, 'Given input: (' + util.inspect(input) + '), an error should be returned');
			eCb();
		});
	}, function () {
		t.end();
	});
});

test('Calculates points.', function (t) {
	var transactions = [
		{
			_id: 0,
			childrenWatched: 2,
			duration: 1,
			sitterId: '0',
			parentId: '1',
			startedAt: 1413096588393
		},
		{
			_id: 1,
			childrenWatched: 3,
			duration: 2,
			sitterId: '0',
			parentId: '1',
			startedAt: 1411376036954
		},
		{
			_id: 2,
			childrenWatched: 1,
			duration: 5,
			sitterId: '1',
			parentId: '2',
			startedAt: 1413096588393
		}
	];

	generateStats({transactions: transactions}, function (err, result) {
		t.notOk(err, 'No error should be returned, received: ' + (err && err.stack));
		var expectedPoints = {
			'0': 13, // 5 points + watched 2 children for 1 hour (2 points) + watched 3 children for 2 hours (6 points) = 13 points
			'1': 2, // 5 points + watched 1 child for 5 hours (5 points) - 8 points given to memberId 0 = 2 points
			'2': 0  // 5 points - 5 points given to member 1 = 0 points
		};

		_.each(result.members, function (member) {
			var expected = expectedPoints[member.memberId];

			t.equal(member.points, expectedPoints[member.memberId], "Expected member (" + member.memberId + ") to have ("
				+ expected + ") points, received: (" + member.points + ") points");
		});

		t.end();
	});
});

test('Ranks sitters by productivity.', function (t) {
	var transactions = [
		{
			_id: 0,
			childrenWatched: 2,
			duration: 1,
			sitterId: '0',
			parentId: '1',
			startedAt: 1413096588393
		},
		{
			_id: 1,
			childrenWatched: 3,
			duration: 2,
			sitterId: '0',
			parentId: '1',
			startedAt: 1411376036954
		},
		{
			_id: 2,
			childrenWatched: 1,
			duration: 5,
			sitterId: '1',
			parentId: '2',
			startedAt: 1413096588393
		}
	];

	generateStats({transactions: transactions}, function (err, result) {
		t.notOk(err, 'No error should be returned, received: ' + (err && err.stack));

		var expectedRanking = ['0', '1', '2'];
		var ranking = _.pluck(result.productiveMembers, 'memberId');
		t.deepEqual(ranking, expectedRanking,  "Expected member-ids ranked in order of productivity to be: " +
			expectedRanking.join(', ') + ", received: " + ranking.join(', '));

		t.end();
	});
});
