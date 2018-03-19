const Users = require('../../../../../schema/Users');
const Tracks = require('../../../../../schema/Tracks');
const connections = require('../../../connections');

module.exports = (payload, user) => {
    connections.updateTrackSync(user.username, payload);
}