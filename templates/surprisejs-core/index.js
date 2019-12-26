#!/usr/bin/env node
require('./app')('mongodb://localhost/Your-database-name').then(app => {
	console.log('Server is running on port 80')
	app.listen(80)
})