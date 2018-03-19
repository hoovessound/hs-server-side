let connections = {

};

module.exports = {
    add(user, id, token){
        if(typeof connections[user.username] !== 'object'){
            // Init user's devices stack
            connections[user.username] = [];
            // Init user's track sync object
            connections[user.username].track = {};
        }
        connections[user.username].push({
            user,
            id,
            token,
            join: new Date(),
            socketId: id,
        });
    },
    remove(username, id){
        if(typeof connections[username] === 'object'){
            const userConnections = connections[username];
            // User still exists
            if(connections[username].length >= 2){
                // More the one connection
                for(let key in userConnections){
                    if(userConnections[key].id === id){
                        // Find the correct device
                        userConnections.splice(key, 1);
                        break;
                    }
                }
            }else{
                // Only one connection left
                delete connections[username];
            }
        }
    },
    users(){
        return connections;
    },
    devices(username){
        return connections[username];
    },
    authenticate(username, jwt){
        if(connections[username]){
            if(connections[username].token === jwt){
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }
    },
    updateTrackSync(username, object){
        connections[username].track = {
            ...connections[username].track,
            ...object,
        }
    },
    getTrack(username){
        return connections[username].track;
    }
}