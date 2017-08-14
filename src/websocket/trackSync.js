const Users = require('../../schema/Users');

module.exports = function (socket) {
    // When someone play a new track
    socket.on('audio:toserver:new', (payload) => {
        const socketConnection = require('../index').socketConnection;
        // Get the payload, and we sent it out the all the user's socket channel
        Users.findOne({
            token: payload.token,
        })
        .then(user => {
            user.socket.forEach((connectionID) => {
                // Emit the message via the web socket
                if(typeof socketConnection[connectionID] !== 'undefined') {
                    if(connectionID !== payload.id){
                        // But don't sent the event to the sender itself
                        socketConnection[connectionID].emit('audio:fromserver:change', payload);
                    }
                }else{
                    // Remove the fake connection ID
                    user.socket.splice(user.socket.indexOf(connectionID), 1);
                    return Users.update({
                        _id: user._id,
                    }, user)
                    .catch(error => {
                        console.log(error);
                    });
                }
            });
        })
        .catch(error => {
            console.log(error);
        })
    });

    // When someone pause an existing track
    socket.on('audio:toserver:pause', (payload) => {
        const socketConnection = require('../index').socketConnection;
        // Get the payload, and we sent it out the all the user's socket channel
        Users.findOne({
            token: payload.token,
        })
        .then(user => {
            user.socket.forEach((connectionID) => {
                // Emit the message via the web socket
                if(typeof socketConnection[connectionID] !== 'undefined') {
                    if(connectionID !== payload.id){
                        // But don't sent the event to the sender itself
                        socketConnection[connectionID].emit('audio:fromserver:pause', payload);
                    }
                }else{
                    // Remove the fake connection ID
                    user.socket.splice(user.socket.indexOf(connectionID), 1);
                    return Users.update({
                        _id: user._id,
                    }, user)
                    .catch(error => {
                        console.log(error);
                    });
                }
            });
        })
        .catch(error => {
            console.log(error);
        })
    });

    // When someone play an existing track
    socket.on('audio:toserver:pause', (payload) => {
        const socketConnection = require('../index').socketConnection;
        // Get the payload, and we sent it out the all the user's socket channel
        Users.findOne({
            token: payload.token,
        })
        .then(user => {
            user.socket.forEach((connectionID) => {
                // Emit the message via the web socket
                if(typeof socketConnection[connectionID] !== 'undefined') {
                    if(connectionID !== payload.id){
                        // But don't sent the event to the sender itself
                        socketConnection[connectionID].emit('audio:fromserver:play', payload);
                    }
                }else{
                    // Remove the fake connection ID
                    user.socket.splice(user.socket.indexOf(connectionID), 1);
                    return Users.update({
                        _id: user._id,
                    }, user)
                    .catch(error => {
                        console.log(error);
                    });
                }
            });
        })
        .catch(error => {
            console.log(error);
        })
    });

    socket.on('audio:toserver:volume', (payload) => {
        const socketConnection = require('../index').socketConnection;
        // Get the payload, and we sent it out the all the user's socket channel
        Users.findOne({
            token: payload.token,
        })
        .then(user => {
            user.socket.forEach((connectionID) => {
                // Emit the message via the web socket
                if(typeof socketConnection[connectionID] !== 'undefined') {
                    if(connectionID !== payload.id){
                        // But don't sent the event to the sender itself
                        socketConnection[connectionID].emit('audio:fromserver:volume', payload);
                    }
                }else{
                    // Remove the fake connection ID
                    user.socket.splice(user.socket.indexOf(connectionID), 1);
                    return Users.update({
                        _id: user._id,
                    }, user)
                    .catch(error => {
                        console.log(error);
                    });
                }
            });
        })
        .catch(error => {
            console.log(error);
        })
    });
}