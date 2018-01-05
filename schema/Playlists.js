const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const playListSchema = new Schema({
    id: String, // Playlist ID
    title: String, // Playlist title
    author: Schema.Types.Mixed, // Author HS UUID
    tracks: Array, // An array of tracks,
    fork: {
        type: Boolean,
        defualt: false,
    }, // If this track is an fork or not
    favorites: Array, // An array of user had favorite this playlist
    coverImage: String, // The cover art of this playlist
});
module.exports = mongoose.model('Playlist', playListSchema);