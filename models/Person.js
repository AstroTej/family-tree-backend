const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  postMaritalName: { type: String, default: '' }, // NEW FIELD
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  dateOfBirth: { type: Date },
  dateOfDeath: { type: Date },
  location: { type: String, default: '' },
  occupation: { type: String, default: '' },
  bio: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  
  father: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null },
  mother: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null },
  spouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }]
}, { timestamps: true });

module.exports = mongoose.model('Person', personSchema);
