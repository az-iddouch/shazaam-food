const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
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
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review ?`);
  console.log('data saved in database 🙌 🙌 🙌 🙌 ');
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 4;
  const skip = page * limit - limit;
  // 1. Query the database for the list of all Stores
  const storesPromise = Store.find()
    .populate('reviews')
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });
  const countPromise = Store.count();
  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!stores.length && skip) {
    req.flash(
      'info',
      `Eyy! you asked for page ${page}. But that page doesn't exist, this is the last page we got !`
    );
    res.redirect(`/stores/page/${pages}`);
    return;
  }

  res.render('stores', { title: 'stores', stores, count, pages, page });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it !');
  }
};

exports.editStore = async (req, res) => {
  // 1. find the store given the Id
  const store = await Store.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the store
  confirmOwner(store, req.user);
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
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews'); // we can do populate('author') to populate the author field in the returned object
  if (!store) return next();
  res.render('showStore', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery }); // where tags includes tag
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]); // because we decided to run both promises at once for optimization purposes
  res.render('tags', { tags, title: 'tags', tag, stores });
};

exports.searchStores = async (req, res) => {
  const stores = await Store.find(
    {
      // because we indexed the title and description using 'text'
      // so now we can search on all the fields that are indexed with 'text'
      $text: {
        $search: req.query.q
      }
    },
    {
      // we project a field "score" with a hidden score that mongo calculates
      // to use it in ordering our sent data
      score: { $meta: 'textScore' }
    }
  )
    .sort({
      score: { $meta: 'textScore' }
    })
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 //10 km
      }
    }
  };
  const stores = await Store.find(q).select('slug name description location photo');
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { [operator]: { hearts: req.params.id } },
    { new: true }
  );
  res.json(user);
};

exports.showHeartedStores = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });
  res.render('stores', { title: 'Hearted stores', stores });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  res.render('topStores', { stores, title: 'Top stores.' });
};
