const mongoose = require('mongoose');

const roleRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  requestedRole: {
    type: String,
    required: true,
    enum: ['Lab Lead', 'Staff', 'Intern', 'Member'], // Added 'Member'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
}, {
  timestamps: true,
});

const RoleRequest = mongoose.model('RoleRequest', roleRequestSchema);

module.exports = RoleRequest;
