const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  _id: String, // use doc id as _id
  data: { type: Object, default: { ops: [{ insert: '\n' }] } }, // store Quill Delta
  updatedAt: { type: Date, default: Date.now }
});

DocumentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Document', DocumentSchema);
