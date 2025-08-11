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
      websiteLink,
      formLink,
    } = req.body;

    // --- NEW LOGIC TO RECONSTRUCT ARRAYS ---
    const timeline = [];
    if (req.body.timeline) {
      for (let i = 0; i < req.body.timeline.length; i++) {
        timeline.push({
          description: req.body.timeline[i].description,
          fromDate: req.body.timeline[i].fromDate,
          toDate: req.body.timeline[i].toDate,
          mode: req.body.timeline[i].mode,
        });
      }
    }

    const points = [];
    if (req.body.points) {
      for (let i = 0; i < req.body.points.length; i++) {
        points.push({
          round: req.body.points[i].round,
          juniorPoints: req.body.points[i].juniorPoints,
          seniorPoints: req.body.points[i].seniorPoints,
        });
      }
    }
    // --- END NEW LOGIC ---

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
      timeline, // Use the reconstructed array
      points,   // Use the reconstructed array
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