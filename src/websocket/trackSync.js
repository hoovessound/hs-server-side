const Users = require('../../schema/Users');
module.exports = function (socket) {
    // When someone play a new track
    socket.on('audio:toserver:new', (payload) => {
        // Get the payload, and we sent it out the all the user's socket channel
        Users.findOne({
            token: payload.token,
        })
        .then(user => {
            const socketConnection = require('../index').socketConnection[user.username];
            for(let key in socketConnection){
                if(key){
                    if(socketConnection[key].id !== payload.id){
                        // But don't sent the event to the sender itself
                        socketConnection[key].emit('audio:fromserver:change', payload)
                    }
                }
            }

            user.lastPlay = {
                date: new Date(),
                trackID: payload.trackID,
                volume: payload.volume,
                isPlaying: true,
            }

            return Users.update({
                _id: user._id
            }, user);

        })
        .catch(error => {
            console.log(error);
        })
    });

    // When someone pause an existing track
    socket.on('audio:toserver:pause', (payload) => {
        // Get the payload, and we sent it out the all the user's socket channel
        Users.findOne({
            token: payload.token,
        })
        .then(user => {
            const socketConnection = require('../index').socketConnection[user.username];
            for(let key in socketConnection){
                if(key){
                    if(socketConnection[key].id !== payload.id){
                        // But don't sent the event to the sender itself
                        socketConnection[key].emit('audio:fromserver:pause', payload)
                    }
                }
            }

            user.lastPlay.isPlaying = false;

            return Users.update({
                _id: user._id
            }, user);

        })
        .catch(error => {
            console.log(error);
        })
    });

    // When someone play an existing track
    socket.on('audio:toserver:play', (payload) => {
        // Get the payload, and we sent it out the all the user's socket channel
        Users.findOne({
            token: payload.token,
        })
        .then(user => {
            const socketConnection = require('../index').socketConnection[user.username];
            for(let key in socketConnection){
                if(key){
                    if(socketConnection[key].id !== payload.id){
                        socketConnection[key].emit('audio:fromserver:play', payload)
                    }
                }
            }

            user.lastPlay.isPlaying = false;

            return Users.update({
                _id: user._id
            }, user);

        })
        .catch(error => {
            console.log(error);
        })
    });

    socket.on('audio:toserver:volume', (payload) => {
        // Get the payload, and we sent it out the all the user's socket channel
        Users.findOne({
            token: payload.token,
        })
        .then(user => {
            const socketConnection = require('../index').socketConnection[user.username];
            for(let key in socketConnection){
                if(key){
                    if(socketConnection[key].id !== payload.id){
                        socketConnection[key].emit('audio:fromserver:volume', payload)
                    }
                }
            }

            user.lastPlay.volume = payload.volume;

            return Users.update({
                _id: user._id
            }, user);

        })
        .catch(error => {
            console.log(error);
        })
    });

    socket.on('audio:toserver:timeupdate', (payload) => {
        // Get the payload, and we sent it out the all the user's socket channel
        Users.findOne({
            token: payload.token,
        })
        .then(user => {
            const socketConnection = require('../index').socketConnection[user.username];
            for(let key in socketConnection){
                if(key){
                    if(socketConnection[key].id !== payload.id){
                        socketConnection[key].emit('audio:fromserver:timeupdate', payload)
                    }
                }
            }

            user.lastPlay.playtime.currentTime = payload.playtime.currentTime;
            user.lastPlay.playtime.duration = payload.playtime.duration;

            return Users.update({
                _id: user._id
            }, user);

        })
        .catch(error => {
            console.log(error);
        })
    });
}