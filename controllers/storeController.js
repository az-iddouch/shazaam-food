const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      // if we pass it something as first argument it assumes that it's an error
      // and the second parametre is the thing thatwe'll pass
      next(null, true);
    } else {
      next({ message: "that file type isn't allowed" }, false);
    }
  }
};

exports.homePage = (req, res) => {
  res.render('home');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

// for a single field named photo
exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there's no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our file system, keep going !
  next();
};

exports.createStore = async (req, res) => {
  const store = await new Store(req.body).save();
  req.flash(
    'success',
    `Successfully created ${store.name}. Care to leave a review ?`
  );
  console.log('data saved in database 🙌 🙌 🙌 🙌 ');
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  // 1. Query the database for the list of all Stores
  const stores = await Store.find();

  res.render('stores', { title: 'stores', stores });
};

exports.editStore = async (req, res) => {
  // 1. find the store given the Id
  const store = await Store.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the store
  // 3. Render out the edit form so the user can edit their Store
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // set location data to be a Point
  // because after update mongoDB doesn't give it the type of a Point
  req.body.location.type = 'Point';
  // find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store instead of the old one
    runValidators: true
  }).exec();
  // redirect them to the store and tell them it worked
  req.flash(
    'success',
    `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${
      store.slug
    }">View Store ➡</a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
};

exports.showStore = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug });
  if (!store) return next();
  res.render('showStore', { store, title: store.name });
};
