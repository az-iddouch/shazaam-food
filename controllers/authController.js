const passport = require('passport');

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
