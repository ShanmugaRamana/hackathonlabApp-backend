const isAdmin = (req, res, next) => {
  // Check if the session variable is set
  if (req.session && req.session.isAdmin) {
    return next(); // If logged in, proceed to the next function
  } else {
    // If not logged in, redirect to the login page
    return res.redirect('/dashboard/login');
  }
};

module.exports = { isAdmin };
