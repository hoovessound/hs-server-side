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
    coverImage: String,
    comments: Array,
    fave: Array,
    description: String,
    private: {
        type: Boolean,
        default: false,
    },
    tags: Array,
});
module.exports = mongoose.model('Tracks', tracksSchema);