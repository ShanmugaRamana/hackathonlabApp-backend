const Event = require('../models/Event');
const imagekit = require('../config/imagekit');

// @desc    Create a new event
// @route   POST /dashboard/events
// @access  Admin
const createEvent = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    
    const {
      eventName,
      description,
      registrationDeadline,
      websiteLink,
      formLink,
      timeline: timelineData,
      points: pointsData
    } = req.body;

    // Process timeline data
    const timeline = [];
    if (timelineData && typeof timelineData === 'object') {
      // If timelineData is an object with numeric keys, convert to array
      const timelineArray = Array.isArray(timelineData) ? timelineData : Object.values(timelineData);
      
      timelineArray.forEach(item => {
        if (item && item.description && item.fromDate && item.toDate && item.mode) {
          timeline.push({
            description: item.description.trim(),
            fromDate: new Date(item.fromDate),
            toDate: new Date(item.toDate),
            mode: item.mode,
          });
        }
      });
    }

    // Process points data
    const points = [];
    if (pointsData && typeof pointsData === 'object') {
      // If pointsData is an object with numeric keys, convert to array
      const pointsArray = Array.isArray(pointsData) ? pointsData : Object.values(pointsData);
      
      pointsArray.forEach(item => {
        if (item && item.round && item.juniorPoints && item.seniorPoints) {
          points.push({
            round: item.round.trim(),
            juniorPoints: parseInt(item.juniorPoints, 10),
            seniorPoints: parseInt(item.seniorPoints, 10),
          });
        }
      });
    }

    console.log('Processed timeline:', timeline); // Debug log
    console.log('Processed points:', points); // Debug log

    // Handle thumbnail upload
    let thumbnailUrl = '';
    if (req.file) {
      try {
        const response = await imagekit.upload({
          file: req.file.buffer,
          fileName: req.file.originalname,
          folder: 'hackathon-lab-events',
        });
        thumbnailUrl = response.url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).send('Error uploading image');
      }
    }

    // Create the event
    const newEvent = await Event.create({
      eventName: eventName.trim(),
      thumbnail: thumbnailUrl,
      description: description.trim(),
      registrationDeadline: new Date(registrationDeadline),
      timeline,
      points,
      websiteLink: websiteLink ? websiteLink.trim() : '',
      formLink: formLink ? formLink.trim() : '',
    });

    console.log('Created event:', newEvent); // Debug log

    res.redirect('/dashboard/events');
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).send('Server Error: ' + error.message);
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
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all events for dashboard
// @route   GET /dashboard/events
// @access  Admin
const getDashboardEvents = async (req, res) => {
  try {
    const events = await Event.find({}).sort({ createdAt: -1 });
    res.render('events', { events }); // Assuming you have an events.ejs template
  } catch (error) {
    console.error('Error fetching dashboard events:', error);
    res.status(500).send('Server Error');
  }
};

module.exports = { createEvent, getEvents, getDashboardEvents };