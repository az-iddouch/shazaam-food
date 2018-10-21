const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.validateRegister = (req, res, next) => {
  // we have these methodes because we used the
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req
    .checkBody('email', 'That email is not valid!')
    .notEmpty()
    .isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extention: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password cannot be blank!').notEmpty();
  req
    .checkBody('password-confirm', 'confirmed Password cannot br blank!')
    .notEmpty();
  req
    .checkBody('password-confirm', 'Oooops!! your password do not match !')
    .equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash()
    }); // if we need the flashes on the same request this is how we explicitely pass them
    return;
  }
  next(); // No errors
};

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  // User.register(user, req.body.password, function(err, user) {
  // });
  // make User.register promise based instead of callback based
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  next(); // pass to authController.login
};
