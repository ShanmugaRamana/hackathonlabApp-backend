const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  thumbnail: { type: String, required: true }, // URL from ImageKit
  description: { type: String, required: true },
  registrationDeadline: { type: Date, required: true },
  timeline: [{
    title: String,
    description: String,
  }],
  points: [{
    round: String,
    value: Number,
  }],
  websiteLink: { type: String },
  formLink: { type: String },
}, {
  timestamps: true,
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
