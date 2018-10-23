const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

// because we used that plugin in User.js
passport.use(User.createStrategy());

// so we can pass the logged user in the request
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
