const jwt = require('jsonwebtoken');
module.exports = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWTTOKEN, (error, decodeObject) => {
            if(error){
                reject(error);
            }else{
                resolve(decodeObject);
            }
        });
    })
}