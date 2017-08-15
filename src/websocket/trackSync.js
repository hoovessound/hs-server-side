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
                        // But don't sent the event to the sender itself
                        socketConnection[key].emit('audio:fromserver:play', payload)
                    }
                }
            }
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
                        // But don't sent the event to the sender itself
                        socketConnection[key].emit('audio:fromserver:volume', payload)
                    }
                }
            }
        })
        .catch(error => {
            console.log(error);
        })
    });
}