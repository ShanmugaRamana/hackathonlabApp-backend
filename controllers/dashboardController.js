const getDashboardPage = (req, res) => {
  res.render('dashboard');
};

const getLoginPage = (req, res) => {
  // Pass an empty error message initially
  res.render('login', { error: '' });
};

const loginAdmin = (req, res) => {
  const { username, password } = req.body;
  
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    // Set session variable on successful login
    req.session.isAdmin = true;
    res.redirect('/dashboard');
  } else {
    // Render login page again with an error message
    res.render('login', { error: 'Invalid username or password' });
  }
};

const logoutAdmin = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/dashboard/login');
  });
};

module.exports = { getDashboardPage, getLoginPage, loginAdmin, logoutAdmin };
