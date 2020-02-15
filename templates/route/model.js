const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Your-model-name = new Schema({
	// Your keys here. Example:
	// name: String,
},
{ timestamps: true });

module.exports = mongoose.model('Your-model-name', Your-model-name);
