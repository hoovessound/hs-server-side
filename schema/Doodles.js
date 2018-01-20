const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DoodlesSchema = new Schema({
    id: String, // Random ID
    title: String, // The title of this doodle
    author: Schema.Types.Mixed,
    link: String, // Author's origin link EP: Facebook profile or DeviantArt profile page
    image: String, // The image itself
    used: {
        // How many times this image has been used
        type: Number,
        default: 0,
    },
    pending: {
        type: Boolean,
        default: true,
    }
});
module.exports = mongoose.model('doodles', DoodlesSchema);