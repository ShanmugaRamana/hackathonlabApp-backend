const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  thumbnail: { type: String, required: true },
  description: { type: String, required: true },
  registrationDeadline: { type: Date, required: true },
  // --- NEW STATUS FIELD ---
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open',
  },
  timeline: [{
    description: String,
    fromDate: Date,
    toDate: Date,
    mode: String,
  }],
  points: [{
    round: String,
    juniorPoints: Number,
    seniorPoints: Number,
  }],
  websiteLink: { type: String },
  formLink: { type: String },
}, {
  timestamps: true,
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
