const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const NotificationSchema = new Schema({
    id: String, // A UUID of this payload
    title: String, // The title of this payload
    link: String, // A link to this payload
    message: String, // The message of this payload
    icon: String, // The picture of this payload
    data: Date, // The sent date
    author: Schema.Types.Mixed, // The author HS UUID
    receiver: String, // The receiver HS UUID
    read: Boolean, // Is the receiver read this payload yet
});
module.exports = mongoose.model('notification', NotificationSchema);