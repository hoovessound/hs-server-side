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
let dbUrl;
cli
    .version('1.0.0')
    .option('--port [number]', 'The port that HoovesSound will running on')
    .parse(process.argv);

// Settings up MongoDB
if(process.env.DB){
    module.exports.db = {
        url: process.env.DB,
    }
    console.log(`Using DB: ${color.yellow(process.env.DB)}`)
}else{
    console.log(`Please set up the  ${color.yellow('$DB')} environmental variable`);
    process.exit();
}

// Settings up Google Cloud Platform
if(process.env.GCS_AUTH){
    const gcsAuth = JSON.parse(process.env.GCS_AUTH);
    // Create that file
    if(!fsp.existsSync(path.join(`${__dirname}/../gcsAuth`))){
        console.log('Creating the gcsAuth directory');
        fsp.mkdirSync(path.join(`${__dirname}/../gcsAuth`));
    }
    const gcsPath = path.join(`${__dirname}/../gcsAuth/gcsAuthToken.json`);
    fsp.writeFileSync(gcsPath, process.env.GCS_AUTH);
    module.exports.gcsPath = gcsPath;
    console.log(`GCS Project ID: ${color.yellow(gcsAuth.project_id)}`);
}else{
    console.log(`Please set up the  ${color.yellow('$GCS_AUTH')} environmental variable`);
    process.exit();
}

// Settings up Mailgun
if(process.env.MAILGUN_KEY){
    module.exports.mailgun = {
        key: process.env.MAILGUN_KEY,
    }
}else{
    console.log(`Please set up the  ${color.yellow('$MAILGUN_KEY')} environmental variable`);
    process.exit();
}

if(process.env.MAILGUN_DOMAIN){
    module.exports.mailgun = {
        domain:  process.env.MAILGUN_DOMAIN,
    }
}else{
    console.log(`Please set up the  ${color.yellow('$MAILGUN_DOMAIN')} environmental variable`);
    process.exit();
}

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
        });
    }
}).catch(error => {
    console.log(error);
});

server.listen(port, () => {
    console.log(`HoovesSound are running on port ${color.green(port)}`);
    // connect to the db
    mongoose.connect(process.env.DB, {
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