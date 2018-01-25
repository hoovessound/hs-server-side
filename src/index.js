const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
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
const skygear = require('skygear');

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

// Check of require directory
fsp.exists(path.join(`${__dirname}/../usersContent`)).then(exists => {
    if (!exists) {
        fsp.mkdir(path.join(`${__dirname}/../usersContent`), () => {
            console.log('usersContent directory created');
            return false;
        });
    }
}).catch(error => {
    console.log(error);
});

fsp.exists(path.join(`${__dirname}/../tracks`)).then(exists => {
    if (!exists) {
        fsp.mkdir(path.join(`${__dirname}/../tracks`), () => {
            console.log('tracks directory created');
        });
    }
}).catch(error => {
    console.log(error);
});

skygear.config({
    'endPoint': 'https://hoovessound.skygeario.com/', // trailing slash is required
    'apiKey': 'e85bab9ff9a5403e851170dfd2731364',
}).then(container => {
    console.log('Skygear is ready');
}, (error) => {
    console.error(error);
});

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

const io = require('socket.io').listen(server);
module.exports.io = io;

server.listen(port, () => {
    console.log(`HoovesSound are running on port ${color.green(port)}`);
    // connect to the db
    mongoose.connect(process.env.DB, {
        useMongoClient: true,
    });
});

// Using GZIP
app.use(compression());

// Productions only settings
if (process.env.NODE_ENV === 'production') {
    // Production
} else {
    // Development only settings
    
    // using the morgan dev server log
    app.use(morgan('dev'));
}

app.all('/favicon.ico', (req, res) => {
    res.set('Cache-Control', 'public, max-age=31557600');
    res.set('Transfer-Encoding', 'chunked');
    request('https://storage.googleapis.com/hs-static/favicon.png').pipe(res);
});

// Using Socket.io
app.use((req, res, next) => {
    res.io = io;
    next();
});

// No CSRF check

app.use(subdomain('api', require('./router/api')));

app.use(subdomain('id', require('./router/id')));

app.use(subdomain('stream', require('../API/GET/listen')));

// app.use(subdomain('developer', require('../API/listen')));

app.use(subdomain('console.developer', require('./router/view/oAuthApp')));

app.use(csurf());
app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)
    res.status(401);
    res.json({
        error: 'Incorrect CSRF token',
    })
});