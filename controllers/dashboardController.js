const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');
const Event = require('../models/Event');
// --- Login/Logout functions remain the same ---
const getLoginPage = (req, res) => {
  res.render('login', { error: '' });
};
const loginAdmin = (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.isAdmin = true;
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
};
const logoutAdmin = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/dashboard/login');
  });
};

// --- Dashboard Page ---
const getDashboardPage = (req, res) => {
  res.render('dashboard');
};

// --- Role Request Functions ---
const getRoleRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.find({ status: 'Pending' });
    res.render('roles', { requests });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
const approveRoleRequest = async (req, res) => {
  try {
    const request = await RoleRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).send('Request not found');
    }
    await User.findByIdAndUpdate(request.user, { role: request.requestedRole });
    request.status = 'Approved';
    await request.save();
    res.redirect('/dashboard/roles');
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
const rejectRoleRequest = async (req, res) => {
  try {
    const request = await RoleRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).send('Request not found');
    }
    request.status = 'Rejected';
    await request.save();
    res.redirect('/dashboard/roles');
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
// --- NEW EVENTS FUNCTION ---
const getEventsPage = (req, res) => {
  try {
    res.render('events');
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getDashboardPage,
  getLoginPage,
  loginAdmin,
  logoutAdmin,
  getRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
  getEventsPage, // Export new function
};
