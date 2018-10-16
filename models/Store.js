const mongoose = require('mongoose');
mongoose.Promise = global.Promise; // global is like Window in the browser
const slug = require('slugs');

const StoreSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'please enter a store name !!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created_at: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [
      {
        type: Number,
        required: 'You must supply coordinates!'
      }
    ],
    address: {
      type: String,
      required: 'You must supply an Address !'
    }
  },
  photo: String
});

StoreSchema.pre('save', function(next) {
  // if the name is not modefied
  if (!this.isModified('name')) {
    next(); // Skip it
    return; // Stop this function from running
  }
  this.slug = slug(this.name);
  next();
});

// TODO make resiliant so slugs are unique

module.exports = mongoose.model('Store', StoreSchema);
