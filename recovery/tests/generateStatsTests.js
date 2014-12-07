var test = require('tape');
var fs = require('fs');
var path = require('path');
var generateStats = require('../generateStats');

test('Calculates the total amount of points for each baby sitter.', function (t) {
	// ids 0 and 1 start with 5 points
	var transactions = [
		{
			_id: 'transaction1',
			childrenWatched: 3,
			duration: 2,
			sittingProviderId: '0',
			sittingReceiverId: '1',
			startedAt: 1411376036954
			// id: 0  5 + (2 * 3) = 11 points
			// id: 1  5 - 6 = -1 point
		},
		{
			_id: 'transaction2',
			childrenWatched: 2,
			duration: 1,
			sittingProviderId: '0',
			sittingReceiverId: '1',
			startedAt: 1413096588393
			// id: 0  11 + 2 points = 13 points
			// id: 1  -1 + -2 points = -3 point
		},
		{
			_id: 'transaction3',
			childrenWatched: 1,
			duration: 5,
			sittingProviderId: '1',
			sittingReceiverId: '2',
			startedAt: 1413096588393
			// id: 1  -3 + 5 points = 2 point
			// id: 2   5 + -5 points = 0 points
		}
	];

	generateStats({transactions: transactions}, function (err, result) {
		t.notOk(err, 'No error should be returned, received: ' + (err && err.stack));
		t.deepEqual(result, [
			{
				points: 13,
				totalChildrenWatched: 5,
				receiversSatFor: {'1': 2},
				amtReceiversSatFor: 1,
				maxConcurrentChildrenWatched: 3,
				maxDurationChildrenWatched: 2,
				sitterId: '0',
				_id: '!stat0'
			},
			{
				points: 2,
				totalChildrenWatched: 1,
				receiversSatFor: {'2': 1},
				amtReceiversSatFor: 1,
				maxConcurrentChildrenWatched: 1,
				maxDurationChildrenWatched: 5,
				sitterId: '1',
				_id: '!stat1'
			},
			{
				points: 0,
				totalChildrenWatched: 0,
				receiversSatFor: {},
				amtReceiversSatFor: 0,
				maxConcurrentChildrenWatched: 0,
				maxDurationChildrenWatched: 0,
				sitterId: '2',
				_id: '!stat2'
			}
		]);
		t.end();
	});
});
