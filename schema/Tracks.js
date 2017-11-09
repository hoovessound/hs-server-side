const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const tracksSchema = new Schema({
    id: String,
    title: String,
    file: {
        location: String,
        extend: Boolean,
    },
    author: Schema.Types.Mixed,
    uploadDate: Date,
    coverImage: {
        type: String,
        default: 'https://images.discordapp.net/attachments/333151306736730115/333680672264945664/missing_song_cover.jpg?width=500&height=500',
    },
    comments: Array,
    fave: Array,
    description: String,
    private: {
        type: Boolean,
        default: false,
    }
});
module.exports = mongoose.model('Tracks', tracksSchema);