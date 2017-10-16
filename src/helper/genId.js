module.exports = function (length=20) {
    const crypto = require('crypto');
    const base64Url = require('base64-url');
    const randomBytes = crypto.randomBytes(length);
    const randomstring = randomBytes.toString('hex');
    const hashed = base64Url.encode(randomstring);
    return hashed;
}