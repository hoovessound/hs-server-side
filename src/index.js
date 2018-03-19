const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
module.exports.io = io;
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const randomstring = require('randomstring');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const fsp = require('fs-promise');
const color = require('cli-color');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const request = require('request');
const csurf = require('csurf');
const subdomain = require('express-subdomain');
const tmp = require('tmp');
const genId = require('./helper/genId');

require('dotenv').config();

let socketConnection = {};
module.exports.socketConnection = socketConnection;

const envs = [
    'DB',
    'GCS_AUTH',
    'MAILGUN_KEY',
    'MAILGUN_DOMAIN',
    'FILEZIGZAG_TOKEN',
    'FB_CLIENT_ID',
    'FB_SECRET',
    'PV_CLIENT_ID',
    'PV_SECRET',
    'RECAPTCHA',
];

envs.map(env => {
    if(process.env[env]){
        console.log(`ENV CHECK: ${color.blue(env)} ${color.green('PASS')} `);
    }else{ 
        console.log(`ENV CHECK: ${color.yellow(env)} ${color.red('FAIL')} `);
        process.exit();
    }
});

module.exports.db = {
    url: process.env.DB,
};

const gcsAuth = JSON.parse(process.env.GCS_AUTH);
// Create that file
if (!fsp.existsSync(path.join(`${__dirname}/../gcsAuth`))) {
    console.log('Creating the gcsAuth directory');
    fsp.mkdirSync(path.join(`${__dirname}/../gcsAuth`));
}
const gcsPath = path.join(`${__dirname}/../gcsAuth/gcsAuthToken.json`);
fsp.writeFileSync(gcsPath, process.env.GCS_AUTH);
module.exports.gcsPath = gcsPath;

module.exports.mailgun = {
    key: process.env.MAILGUN_KEY,
};

module.exports.mailgun.domain = process.env.MAILGUN_DOMAIN;

module.exports.filezizgag = {
    key:  process.env.FILEZIGZAG_TOKEN,
};

// Setting up the app port
const port = 3000;

// Create a tmp folder for the application
const tmpobj = tmp.dirSync();
console.log('Tmp dir: ', tmpobj.name);
module.exports.tmp = tmpobj.name;

app.use(helmet());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use('/static', express.static(path.join(`${__dirname}/../staticDest`)));
app.use('/usersContent', express.static(path.join(`${__dirname}/../usersContent`)));
app.set('view engine', 'ejs');
app.set('views', path.join(`${__dirname}/../public`));
app.set('trust proxy', 1);
app.use(cookieParser());

app.use(cookieSession({
    name: `hoovessound`,
    keys: [randomstring.generate(30)],
}));

http.listen(port, () => {
    console.log(`HoovesSound are running on port ${color.green(port)}`);
    // connect to the db
    mongoose.connect(process.env.DB, {
        useMongoClient: true,
    });
});

app.use((req, res, next) => {
    res.io = io;
    next();  
})

// Using GZIP
app.use(compression());

app.all('/favicon.ico', (req, res) => {
    res.set('Cache-Control', 'public, max-age=31557600');
    res.set('Transfer-Encoding', 'chunked');
    request('https://storage.googleapis.com/hs-static/favicon.png').pipe(res);
});

// No CSRF check

app.use(subdomain('api', require('./router/api')));

app.use(subdomain('id', require('./router/id')));

app.use(subdomain('stream', require('../API/GET/listen')));

// app.use(subdomain('developer', require('../API/listen')));

app.use(subdomain('console.developer', require('./router/view/oAuthApp')));

io.on('connection', (socket) => {
    const connections = require('./websocket/connections');

    socket.on('auth.register', payload => {
        // First, register a new socket session in order to get a websocket JWT
        require('./websocket/authorization')(payload.jwt)
        .then(user => {
            const socketJwt = require('./websocket/register')(user);
            connections.add(user, socket.id, socketJwt);
            socket.emit('auth.new', {
                id: socket.id,
                token: socketJwt,
            });

            socket.on('user.sync.track', payload => {
                require('./websocket/events/user/sync/track')(payload, user);
                // Emit the update event to all user's devices
                connections.devices(user.username).map(device => {
                    if(socket.id !== device.id){
                        io.sockets.connected[device.id].emit('user.track.update', connections.getTrack(user.username));
                    }
                });
            });
        
            socket.on('disconnect', () => {
                connections.remove(user.username, socket.id);
            });

        })
        .catch(error => {
            socket.emit('auth.new', {
                error: 'Unauthorized user',
            });
            console.log(error);
        });
    });
});

// Web socket APIs
// Internal use only
app.use(subdomain('socket', require('./router/websocket')));

app.all('*', (req, res) => res.end('HoovesSound API Server'));

app.use(csurf());
app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)
    res.status(401);
    res.json({
        error: 'Incorrect CSRF token',
    })
});