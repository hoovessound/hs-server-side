const Users = require('../../../../../schema/Users');
const Tracks = require('../../../../../schema/Tracks');

module.exports = (payload, user) => {
    user.lastPlay = {
        date: new Date(),
        trackID: payload.trackID,
        volume: payload.volume,
        isPlaying: payload.isPlaying,
        playtime: {
            currentTime: payload.playtime.currentTime,
            duration: payload.playtime.duration,
        }
    }
    Users.update({
        _id: user._id,
    }, user)
    .then(() => {
        console.log('yay')
    })
    .catch(error => {
        console.log(error);
    })
}