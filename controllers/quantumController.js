// @desc    Get the official launch date for the Quantum feature
// @route   GET /api/quantum/launch-date
// @access  Public
const getLaunchDate = (req, res) => {
  // Set a fixed target date 30 days from now
  // This date will be the same for all users
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 30);

  res.status(200).json({
    launchDate: targetDate.toISOString(),
  });
};

module.exports = {
  getLaunchDate,
};