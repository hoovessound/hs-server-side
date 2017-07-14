const express = require('express');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const randomstring = require('randomstring');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const fsp = require('fs-promise');
const fullurl = require('fullurl');
const cli = require('commander');
const color = require('cli-color');

cli
    .version('1.0.0')
    .option('--port [number]', 'The port that HoovesSound will running on')
    .option('--gcs [string]', 'GCS token path')
    .option('--db [string]', 'db.js path')
    .parse(process.argv);

// App init checking
// Check for GCS access
const gcsToken = path.join(cli.gcs || `${__dirname}/../gcsAuth/token.json`);
fsp.exists(gcsToken).then(exists => {
    if(!exists){
        console.log(color.red('ERROR: '));
        console.log('GCS Access Problem');
        console.log(`Please create a ${path.basename(gcsToken)} in the following path`);
        console.log(path.join(`${__dirname}/${gcsToken}`));
        return false;
    }
    module.exports.gcsPath = gcsToken;
}).catch(error => {
    console.log(error);
});

const db = require(cli.db || '../db');

// Setting up the app port
const port = process.env.PORT || cli.port || 3000;

// Check of require directory
fsp.exists(path.join(`${__dirname}/../usersContent`)).then(exists => {
    if(!exists){
        fsp.mkdir(path.join(`${__dirname}/../usersContent`), () => {
            console.log('usersContent directory created');
            return false;
        });
    }
}).catch(error => {
    console.log(error);
});

fsp.exists(path.join(`${__dirname}/../tracks`)).then(exists => {
    if(!exists){
        fsp.mkdir(path.join(`${__dirname}/../tracks`), () => {
            console.log('tracks directory created');
            return false;
        });
    }
}).catch(error => {
    console.log(error);
});

app.listen(port, () => {
    console.log(`HoovesSound are running on port ${color.yellow(port)}`);
    // connect to the db
    mongoose.connect(db.url, {
        useMongoClient: true,
    });
});

// using some middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// express static
app.use('/static', express.static(path.join(`${__dirname}/../static`)));
app.use('/usersContent', express.static(path.join(`${__dirname}/../usersContent`)));

// Set up the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(`${__dirname}/../public`));

// set up the cookie stuff
app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    keys: [randomstring.generate(30)],
    maxAge: 365 * 24 * 60 * 60,
}));

app.use('/api/tracks', require('../API/home'));

app.use('/api/me', require('../API/me'));

app.use('/api/auth/register', require('../API/auth/register'));

app.use('/api/auth/login', require('../API/auth/login'));

app.use('/api/upload', require('../API/upload'));

app.use('/api/listen', require('../API/listen'));

app.use('/api/user', require('../API/user'));

app.use('/api/track', require('../API/track'));

app.use('/api/search', require('../API/search'));

app.use('/api/settings', require('../API/settings'));

app.use('/api/comment', require('../API/comment'));

app.use('/track', require('./router/track'));

app.use('/upload', require('./router/upload'));

app.use('/me', require('./router/me'));

app.use('/user', require('./router/user'));

app.use('/search', require('./router/search'));

app.use('/settings', require('./router/settings'));

app.use('/', require('./router/latesetTracks'));