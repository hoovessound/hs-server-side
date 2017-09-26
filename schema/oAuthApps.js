const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const oAuthAppsSchema = new Schema({
    author: Schema.Types.ObjectId,
    createDate: Date,
    name: String,
    clientId: String,
    clientSecret: String,
    description: {
        type: String,
        default: null,
    },
    callbackUrl: Array,
});
module.exports = mongoose.model('oAuthApps', oAuthAppsSchema);