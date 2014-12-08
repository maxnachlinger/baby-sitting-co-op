var util = require('util');
var _ = require('lodash');
var async = require('async');
var test = require('tape');
var fs = require('fs');
var path = require('path');
var generateStats = require('../../recovery/generateStats');

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

test('Calculates the total amount of points for each baby sitter.', function (t) {
	// ids 0 and 1 start with 5 points
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

		var expectedProductivity = ['0','1', '2'];
		t.deepEqual(
			_.pluck(result.productiveMembers, 'memberId'), expectedProductivity,
			'Members ranked in order of productivity are: ' + expectedProductivity.join(', ')
		);
		t.end();
	});
});
