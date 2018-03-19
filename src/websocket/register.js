const jwt = require('jsonwebtoken');
const genId = require('../helper/genId');
module.exports = (user) => {
    return jwt.sign({
        salt: genId(),
        signDate: Date.now(),
        user,
    }, process.env.JWTTOKEN, {
        expiresIn: 3600 * 1000 * 24 * 365 * 10,
    });
}