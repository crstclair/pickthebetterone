var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var pg = require('pg');
var pgSession = require('connect-pg-simple')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//internal modules
var userModule = require('./user');
var emailModule = require('./email');
var healthCheckModule = require('./healthCheck');

// route modules
var vote = require('./routes/vote');
var stats = require('./routes/stats');
var addNew = require('./routes/addnew');
var register = require('./routes/register');
var login = require('./routes/login');
var logout = require('./routes/logout');
var leaders = require('./routes/leaders');
var checkThing = require('./routes/checkThing');
var profile = require('./routes/profile');
var settings = require('./routes/settings');
var checkSession = require('./routes/checkSession');
var reset = require('./routes/reset');
var verify = require('./routes/verify');
var matchupRedirect = require('./routes/m');
var testBlast = require('./routes/testBlast');

var app = express();

// if(app.get('env') !== 'development') {
//   healthCheckModule.startHealthCheck('https://test.pickthebetterone.com');
// }

//authentication setup
passport.use(new LocalStrategy(
    function(username, password, done) {
      userModule.findUser(username, function(err, user) {
        if(err) {
          return done(err);
        }

        if(!user) {
          return done(null, false);
        }

        user.checkPassword(password, function (err, good) {
          if(err) {
            return done(err);
          }

          if(good) {
            return done(null, user);
          }
          else {
            return done(null, false);
          }
        });
      });
    }
));

passport.serializeUser(function(user, done) {
  done(null, JSON.stringify({id: user.id, username: user.username}));
});

passport.deserializeUser(function(string, done) {
  done(null, JSON.parse(string));
});

//email configuration
emailModule.config({accountsEmail: (app.get('env') === 'development') ? 'pickthebetterone@gmail.com' : 'Accounts@pickthebetterone.com'});

//set environmental variables for database
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://" + process.env.RDS_USERNAME + ":" + process.env.RDS_PASSWORD + "@" + process.env.RDS_HOSTNAME + ":" + process.env.RDS_PORT + "/" + process.env.RDS_DB_NAME;

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.enable('trust proxy');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  store: new pgSession({
    pg: pg
  }),
  secret: 'JDdFiQjbugFOF2TD8gFS',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000  // 14 days
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/vote', vote);
app.use('/stats', stats);
app.use('/addNew', addNew);
app.use('/register', register);
app.use('/login', login);
app.use('/logout', logout);
app.use('/leaders', leaders);
app.use('/checkThing', checkThing);
app.use('/profile', profile);
app.use('/settings', settings);
app.use('/checkSession', checkSession);
app.use('/reset', reset);
app.use('/verify', verify);
app.use('/m', matchupRedirect);
if(app.get('env') === 'development') app.use('/blast', testBlast);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler

app.use(function(err, req, res, next) {
  res.status(err.status || 500);

  if(err.status === 404) {
    //special error screen just for file not found
    return res.sendFile('notfound.html', {root: __dirname}, function (err) {
      if(err) {
        res.send('File not found.');
      }
    });
  }

  var errInfo;
  if(app.get('env') === 'development') {
    //Development environment -- include stack trace
    errInfo = {
      message: err.message,
      stack: err.stack
    };
  }
  else {
    //Production -- no stack trace
    errInfo = {
      message: err.message
    };
  }
  res.json(errInfo);

  console.error(new Date().toString(), err.stack);
});

app.use(function(err, req, res, next) {
  res.status(500).send('An error occurred while attempting to display an error. (I know, crazy, right?)');

  console.error(new Date().toString() + " A meta-error occurred.");

  if(err) {
    console.error(err.stack);
  }
});


module.exports = app;
