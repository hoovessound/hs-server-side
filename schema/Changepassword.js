const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const tracksSchema = new Schema({
    user: Schema.Types.ObjectId,
    token: String,
    createDate: Schema.Types.Date,
    changeDate: Schema.Types.Date,
    updated: Boolean,
});
module.exports = mongoose.model('changepassword', tracksSchema);