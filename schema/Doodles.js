const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DoodlesSchema = new Schema({
    id: String, // Random ID
    author: {
        source: String, // The source EP: deviantart, facebook
        name: String, // Author's name
        link: String, // Author's origin link EP: Facebook profile or DeviantArt profile page
        id: String // HoovesSound's UUID
    },
    image: String, // The image itself
    used: {
        // How many times this image has been used
        type: Number,
        default: 0,
    }
});
module.exports = mongoose.model('doodles', DoodlesSchema);