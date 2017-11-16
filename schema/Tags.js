const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const tagSchema = new Schema({
    name: String,
    tracks: Array
});
module.exports = mongoose.model('Tag', tagSchema);