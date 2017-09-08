const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);
module.exports.io = io;
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const randomstring = require('randomstring');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const fsp = require('fs-promise');
const cli = require('commander');
const color = require('cli-color');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const Users = require('../schema/Users');
const cookie = require('cookie');
const request = require('request');
const csurf = require('csurf');

let socketConnection = {};
module.exports.socketConnection = socketConnection;

cli
.version('1.0.0')
.option('--port [number]', 'The port that HoovesSound will running on')
.parse(process.argv);

// Settings up MongoDB
if (process.env.DB) {
    module.exports.db = {
        url: process.env.DB,
    }
    console.log(`MongoDB status: ${color.green('OK')}`);
}else{
    console.log(`Please set up the  ${color.yellow('$DB')} environmental variable`);
    process.exit();
}

// Settings up Google Cloud Platform
if (process.env.GCS_AUTH) {
    const gcsAuth = JSON.parse(process.env.GCS_AUTH);
    // Create that file
    if (!fsp.existsSync(path.join(`${__dirname}/../gcsAuth`))) {
        console.log('Creating the gcsAuth directory');
        fsp.mkdirSync(path.join(`${__dirname}/../gcsAuth`));
    }
    const gcsPath = path.join(`${__dirname}/../gcsAuth/gcsAuthToken.json`);
    fsp.writeFileSync(gcsPath, process.env.GCS_AUTH);
    module.exports.gcsPath = gcsPath;
    console.log(`Google Cloud Storage status: ${color.green('OK')}`);
}else{
    console.log(`Please set up the  ${color.yellow('$GCS_AUTH')} environmental variable`);
    process.exit();
}

// Settings up Mailgun
if (process.env.MAILGUN_KEY) {
    module.exports.mailgun = {
        key: process.env.MAILGUN_KEY,
    }
} else {
    console.log(`Please set up the  ${color.yellow('$MAILGUN_KEY')} environmental variable`);
    process.exit();
}

if (process.env.MAILGUN_DOMAIN) {
    module.exports.mailgun.domain = process.env.MAILGUN_DOMAIN;
    console.log(`Mailgun services status: ${color.green('OK')}`);
}else{
    console.log(`Please set up the  ${color.yellow('$MAILGUN_DOMAIN')} environmental variable`);
    process.exit();
}

// Settings up FileZigZag
if(process.env.FILEZIGZAG_TOKEN){
    module.exports.filezizgag = {
        key:  process.env.FILEZIGZAG_TOKEN,
    }
    console.log(`FileZiZgag services status: ${color.green('OK')}`);
}else{
    console.log(`Please set up the  ${color.yellow('$FILEZIGZAG_TOKEN')} environmental variable`);
    process.exit();
}

// Setting up the app port
const port = process.env.PORT || cli.port || 3000;

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

// GCS Auth Token Path
module.exports.gcsPath = path.join(`${__dirname}/../gcsAuth/gcsAuthToken.json`);

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
    name: `hoovessound-session-${randomstring.generate(30)}`,
    keys: [randomstring.generate(30)],
    maxAge: 365 * 24 * 60 * 60,
}));

server.listen(port, () => {
    console.log(`HoovesSound are running on port ${color.green(port)}`);
    // connect to the db
    mongoose.connect(process.env.DB, {
        useMongoClient: true,
    });
});

// Productions only settings
if (process.env.NODE_ENV === 'production') {
    // Using GZIP
    app.use(compression());

    app.use((req, res, next) => {
        // HTTP to HTTPS
        if (req.secure) {
            return next();
        } else {
            res.redirect(301, 'https://' + req.hostname + req.url);
        }
    });

} else {
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
app.use('/api', require('./router/API/base'));

io.on('connection', (socket) => {
    const clientCookie = cookie.parse(socket.handshake.headers.cookie);
    const token = clientCookie['oauth-token'];

    // Testing message
    socket.emit('init:testing', {
        msg: 'Your client had connected to the HoovesSound web socket services, please enjoy :D',
        yourId: socket.id,
    });

    Users.findOne({
        token,
    })
    .then(user => {

        if (user === null) {
            socket.emit('error:reload');
            return false;
        }

        if (typeof socketConnection[user.username] === 'undefined') {
            socketConnection[user.username] = {};
        }
        socketConnection[user.username][socket.id] = socket;
        module.exports.socketConnection = socketConnection;

        socket.on('disconnect', () => {
            delete socketConnection[user.username][socket.id];
            module.exports.socketConnection = socketConnection;
            if (socketConnection[user.username].length <= 0) {
                // No more connected client
                user.lastPlay.isPlaying = false;
                Users.update({
                    _id: user._id,
                }, user)
                .catch(error => {
                    console.log(error);
                })
            }
        });

        // Call the track sync feature
        require('./websocket/trackSync')(socket);

    })
    .catch(error => {
        console.log(error);
    })
});

app.use(csurf());
app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)
    // Someone just try to CSRF attack my app lol
    const links = [
        'https://www.youtube.com/watch?v=dv13gl0a-FA', // Deja Vu
        'https://www.youtube.com/watch?v=XCiDuy4mrWU', // Running in The 90s
        'https://www.youtube.com/watch?v=atuFSv2bLa8', // Gas Gas Gas
    ];
    const link = links[Math.floor(Math.random()*links.length)];
    res.redirect(link);
});

const view = require('./router/view/base');
app.use('/', view);