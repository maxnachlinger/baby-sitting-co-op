var path = require('path');

module.exports = {
	dbPath: path.resolve(__dirname + '/../db.level'),
	subLevels: {
		transactions: 'transactions',
		members: 'members',
		productiveMembers: 'productiveMembers'
	},
	levelOptions: {
		createIfMissing: true,
		errorIfExists: false,
		valueEncoding: 'json'
	},
	levelPort: 3000,
	serverPort: 8080
};
