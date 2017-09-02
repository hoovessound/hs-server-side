const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const oAuthAppsSchema = new Schema({
    author: Schema.Types.ObjectId,
    createDate: Date,
    name: String,
    permission: {
        type: Array,
        default: [
            'basic-user-info'
        ]
    },
    clientId: String,
    clientSecret: String,
    description: {
        type: String,
        default: null,
    },
    callbackUrl: String,
});
module.exports = mongoose.model('oAuthApps', oAuthAppsSchema);