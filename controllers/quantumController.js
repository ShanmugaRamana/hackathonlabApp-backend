// @desc    Get the official launch date for the Quantum feature
// @route   GET /api/quantum/launch-date
// @access  Public
const getLaunchDate = (req, res) => {
  // --- THIS IS THE FIX ---
  // A single, constant launch date that is the same for every user, every time.
  // We'll set it to October 21, 2025, at 11:30 PM India Standard Time.
  const fixedLaunchDate = new Date('2025-10-21T23:30:00.000+05:30');

  res.status(200).json({
    launchDate: fixedLaunchDate.toISOString(),
  });
};

module.exports = {
  getLaunchDate,
};