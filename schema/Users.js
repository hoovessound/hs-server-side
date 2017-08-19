const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const usersSchema = new Schema({
    username: String,
    password: String,
    email: String,
    fullName: String,
    token: String,
    tracks: Array,
    icon: {
        type: String,
        default: 'http://fc00.deviantart.net/fs71/f/2012/042/9/b/rainbow_dash_smeel_by_pikachux1000-d4pf9jt.png',
    },
    "banner": {
        type: String,
        default: 'http://vignette4.wikia.nocookie.net/mlp/images/1/15/Ponyville_as_seen_from_Twilight_and_Spike%27s_chariot_S1E01.png/revision/latest?cb=20120904164855'
    },
    fave: Array,
    roles: Array,
    notification: Array,
    lastPlay: {
        date: Schema.Types.Date,
        trackID: Schema.Types.ObjectId,
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
});
module.exports = mongoose.model('Users', usersSchema);