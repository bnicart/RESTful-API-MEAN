var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var UserSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    require: true
  }
});

UserSchema.pre('save', function(next) {
  var user = this;
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) { return next(err); }
      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) { return next(err); }
        user.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});

UserSchema.methods.comparePassword = function(password, callback) {
  bcrypt.compare(password, this.password, function (err, isMatch) {
    if (err) { return callback(err); }
    callback(null, isMatch);
  });
};

var User;
if (mongoose.models.User) {
  User = mongoose.model('User');
} else {
  User = mongoose.model('User', UserSchema);
}
module.exports = User;

