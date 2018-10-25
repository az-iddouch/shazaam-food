const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const crypto = require('crypto');
const promisify = require('es6-promisify');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login !',
  successRedirect: '/',
  successFlash: 'You are now logged !'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', "you're now logged out !");
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  // first check if the user is authenticated
  if (req.isAuthenticated()) {
    next(); // carry on
    return;
  }
  req.flash('error', 'Ooops ! you must be logged in .');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // 1. see if that user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'no account with that email exists');
    return res.redirect('/login');
  }
  // 2. set reset tokens and expiry on their accounts
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // an hour from now
  await user.save();
  // 3. send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  req.flash('success', `you've been email a password reset Link. ${resetURL}`);
  // 4. redirect to login page
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'password reset is invalid or has expired !');
    res.redirect('/login');
  }
  // if there's a user, show the reset password form
  res.render('reset', { title: 'reset your password' });
};

exports.confirmedPassword = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next();
    return;
  }
  req.flash('error', 'your password does not match !');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() } //$gt ==> greater than
  });
  if (!user) {
    req.flash('error', 'password reset is invalid or has expired !');
    res.redirect('/login');
  }
  // we can use this because we used that plugin in our user.js
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordExpires = undefined;
  user.resetPasswordToken = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success', 'your password has been changed successfully !');
  res.redirect('/');
};
