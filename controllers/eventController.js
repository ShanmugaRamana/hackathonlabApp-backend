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

    // --- CORRECTED LOGIC TO RECONSTRUCT ARRAYS ---
    const timeline = [];
    // The form sends timeline data as an array of objects, which we can use directly.
    if (req.body.timeline && Array.isArray(req.body.timeline)) {
        req.body.timeline.forEach(item => {
            if (item.description && item.fromDate && item.toDate && item.mode) {
                timeline.push({
                    description: item.description,
                    fromDate: item.fromDate,
                    toDate: item.toDate,
                    mode: item.mode,
                });
            }
        });
    }

    const points = [];
    // The form sends points data as an array of objects.
    if (req.body.points && Array.isArray(req.body.points)) {
        req.body.points.forEach(item => {
            if (item.round && item.juniorPoints && item.seniorPoints) {
                points.push({
                    round: item.round,
                    juniorPoints: item.juniorPoints,
                    seniorPoints: item.seniorPoints,
                });
            }
        });
    }
    // --- END CORRECTED LOGIC ---

    let thumbnailUrl = '';
    if (req.file) {
      const response = await imagekit.upload({
        file: req.file.buffer,
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
