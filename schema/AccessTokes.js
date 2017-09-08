const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AccessTokesSchema = new Schema({
    token: String,
    timestamp: {
        start: Date,
        end: Date,
    },
    author: {
        app: Schema.Types.ObjectId,
        user: Schema.Types.ObjectId
    },
    permission: Array,
});
module.exports = mongoose.model('accesstoke', AccessTokesSchema);