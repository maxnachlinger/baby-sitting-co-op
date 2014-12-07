var test = require('tape');
var fs = require('fs');
var path = require('path');
var readTransactions = require('../../recovery/readTransactions');

test('Transforms transactions.xml document into an array of objects', function (t) {
	readTransactions({
		transactionsPath: path.normalize(path.join(__dirname, '/transactions.xml'))
	}, function (err, transactions) {
		t.notOk(err, 'No error should be returned, received: ' + (err && err.stack));
		t.deepEqual(transactions, [
			{
				id: '!transaction0',
				childrenWatched: 3,
				duration: 2,
				sittingProviderId: '0',
				sittingReceiverId: '1',
				startedAt: 1411376036954
			},
			{
				id: '!transaction1',
				childrenWatched: 2,
				duration: 1,
				sittingProviderId: '0',
				sittingReceiverId: '2',
				startedAt: 1413096588393
			}
		]);
		t.end();
	});
});
