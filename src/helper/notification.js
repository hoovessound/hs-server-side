const fetch = require('node-fetch');
module.exports = async function(to, payload={}, options={}){
    if(!to){
        return Promise.reject({
            code: 403,
            error: 'Missing receiver token',
        });
    }
    try{
        payload.icon = payload.icon || 'https://storage.googleapis.com/hs-static/favicon.png';
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`,
            },
            body: JSON.stringify({
                to,
                notification: payload,
                priority: options.priority || 'normal',
            }),
        });
        const body = await response.json();
        if(body.failure > 0){
            return Promise.reject({
                code: 500,
                error: 'Something when wrong, maybe you provided an incorrect payload',
            });
        }
        return Promise.resolve({
            code: 200,
            body,
        });
    }
    catch(error){
        return Promise.reject({
            code: 500,
            error: 'Something when wrong while trying to call the FCM API',
        });
    }
}