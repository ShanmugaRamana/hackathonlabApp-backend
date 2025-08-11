const Event = require('../models/Event');
const imagekit = require('../config/imagekit');

// @desc    Create a new event
// @route   POST /dashboard/events
// @access  Admin
const createEvent = async (req, res) => {
  try {
    const {
      eventName,
      description,
      registrationDeadline,
      timeline,
      points,
      websiteLink,
      formLink,
    } = req.body;

    let thumbnailUrl = '';
    if (req.file) {
      const response = await imagekit.upload({
        file: req.file.buffer.toString('base64'),
        fileName: req.file.originalname,
        folder: 'hackathon-lab-events',
      });
      thumbnailUrl = response.url;
    }

    await Event.create({
      eventName,
      thumbnail: thumbnailUrl,
      description,
      registrationDeadline,
      timeline,
      points,
      websiteLink,
      formLink,
    });

    res.redirect('/dashboard/events');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all events for the mobile app
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({}).sort({ createdAt: -1 }); // Newest first
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { createEvent, getEvents };
