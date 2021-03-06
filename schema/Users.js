const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const usersSchema = new Schema({
    id: String,
    username: String,
    password: String,
    email: String,
    fullName: String,
    tracks: Array,
    icon: {
        type: String,
        default: 'http://fc00.deviantart.net/fs71/f/2012/042/9/b/rainbow_dash_smeel_by_pikachux1000-d4pf9jt.png',
    },
    "banner": {
        type: String,
        default: 'https://storage.googleapis.com/hs-static/banner.png'
    },
    fave: Array,
    roles: Array,
    lastPlay: {
        date: Schema.Types.Date,
        trackID: String,
        volume: Number,
        isPlaying: {
            type: Boolean,
            default: false,
        },
        playtime: {
            currentTime: Number,
            duration: Number,
        }
    },
    unreadNotification: {
        type: Boolean,
        default: false,
    },
    fcmTokens: {
        type: Array,
        default: null,
    },
    sendPushNotification: {
        type: Boolean,
        default: false,
    }
});
module.exports = mongoose.model('Users', usersSchema);