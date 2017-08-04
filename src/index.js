const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);
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

cli
    .version('1.0.0')
    .option('--port [number]', 'The port that HoovesSound will running on')
    .parse(process.argv);

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

// If the run time is on production
if(process.env.NODE_ENV) {
    // Create the config file
    console.log(`Node environment ${color.green('IS')} ${color.yellow('PRODUCTION')}`);
    console.log('Creating config file');
    console.log('Creating src/db.js');
    fsp.writeFileSync(path.join(`${__dirname}/db.js`), process.env.DBJS);
    console.log('Creating gscAuth/gscAuthToken.json');
    fsp.writeFileSync(path.join(`${__dirname}/../gscAuth/gscAuthToken.json`), process.env.GCS_KEY_FILE);
    console.log(`App config files is ${color.green('READY')}`);
}else{
    console.log(`Node environment is ${color.blue('NOT')} ${color.yellow('PRODUCTION')}`);
    console.log('Using local db.js and gacAuthToke.json');
}

// GCS Auth Token Path
module.exports.gcsPath = path.join(`${__dirname}/../gcsAuth/gcsAuthToken.json`);
// App init checking
const db = require('./db');

server.listen(port, () => {
    console.log(`HoovesSound are running on port ${color.yellow(port)}`);
    // connect to the db
    mongoose.connect(db.url, {
        useMongoClient: true,
    });
});

// boost up the security
app.use(helmet());

// using some middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// express static
app.use('/static', express.static(path.join(`${__dirname}/../static`)));
app.use('/usersContent', express.static(path.join(`${__dirname}/../usersContent`)));
// Statis HTML website
app.use('/web', express.static(path.join(`${__dirname}/../web`)));

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

// Productions only settings
if(process.env.NODE_ENV === 'production'){
    // Using GZIP
    app.use(compression());
}else{
    // using the morgan dev server log
    app.use(morgan('dev'));
}

// Using Socket.io
app.use((req, res, next) => {
    res.io = io;
    next();
});

// Using the API
app.use('/api', require('./router/API/base'));

app.use('/', require('./router/view/base'));