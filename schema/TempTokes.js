const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TempTokesSchema = new Schema({
    token: String,
    timestamp: {
        start: Date,
        end: Date,
    },
    author: {
        app: String,
        user: String,
    },
    permission: Array,
});
module.exports = mongoose.model('temptoke', TempTokesSchema);