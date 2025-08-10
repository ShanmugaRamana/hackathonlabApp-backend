const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');

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

// --- Updated Dashboard Page ---
const getDashboardPage = (req, res) => {
  res.render('dashboard');
};

// --- NEW FUNCTIONS FOR ROLE REQUESTS ---

// @desc    Get all pending role requests
// @route   GET /dashboard/roles
const getRoleRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.find({ status: 'Pending' });
    res.render('roles', { requests }); // Render a new 'roles.ejs' page
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

// @desc    Approve a role request
// @route   POST /dashboard/roles/approve/:id
const approveRoleRequest = async (req, res) => {
  try {
    const request = await RoleRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).send('Request not found');
    }
    // Update the user's role
    await User.findByIdAndUpdate(request.user, { role: request.requestedRole });
    // Update the request status
    request.status = 'Approved';
    await request.save();
    res.redirect('/dashboard/roles');
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

// @desc    Reject a role request
// @route   POST /dashboard/roles/reject/:id
const rejectRoleRequest = async (req, res) => {
  try {
    const request = await RoleRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).send('Request not found');
    }
    // Update the request status
    request.status = 'Rejected';
    await request.save();
    res.redirect('/dashboard/roles');
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
};
