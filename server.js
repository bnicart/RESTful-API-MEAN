var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/database');
var User = require('./app/models/user');
var port = process.env.PORT || 8080;
var jwt = require('jwt-simple');

// OPTION 1 for CORS issue
// var allowCrossDomain = function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-Type');
//
//   next();
// }
// app.use(allowCrossDomain);

// OPTION 2 for CORS issue
var cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.use(passport.initialize());

app.get('/', function(req, res) {
  res.send('Hello! The API is http://localhost:' + port + '/api');
});

// connect to database
mongoose.connect(config.database);
require('./config/passport')(passport);

var apiRoutes = express.Router();

apiRoutes.post('/signup', function(req, res) {
  if (!req.body.name || !req.body.password) {
    res.json({success: false, msg: 'Please supply name and password'});
  } else {
    var newUser = new User({
      name: req.body.name,
      password: req.body.password
    });

    newUser.save(function(err) {
      if (err) { return res.json({success: false, msg: 'Username already exists.'}); }
      res.json({success: true, msg: 'Successfully created new user.'});
    });
  }
});

apiRoutes.post('/authenticate', function (req, res) {
  User.findOne({
    name: req.body.name
  }, function (err, user) {
    if (err) throw err;

    if (!user) {
      res.send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          var token = jwt.encode(user, config.secret);
          res.json({success: true, token: 'JWT ' + token});
        } else {
          res.send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

apiRoutes.get('/memberinfo', passport.authenticate('jwt', { session: false }), function (req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findOne({
      name: decoded.name
    }, function (err, user) {
      if (err) throw err;
      if (!user) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json({success: true, msg: 'Welcome in the member area ' + user.name + '!' });
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

app.use('/api', apiRoutes);

app.listen(port);
console.log('There will be dragons: http://localhost:' + port);

