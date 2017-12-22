const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AccessTokesSchema = new Schema({
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
module.exports = mongoose.model('accesstoke', AccessTokesSchema);