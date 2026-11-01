const User = require('../models/User');
const Organization = require('../models/Organization');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendInviteEmail } = require('../utils/email');

const inviteUser = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const org = await Organization.findById(orgId);

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const currentUsers = await User.countDocuments({
      orgId,
      isActive: true
    });

    const userLimit = org.userLimit || 5;
    if (currentUsers >= userLimit) {
      return res.status(403).json({
        message: 'User limit reached. Upgrade plan first.',
        currentUsers,
        userLimit,
        upgradeRequired: true
      });
    }

    const { email, firstName, lastName, role, password, activateImmediately } = req.body;

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({
        message: 'Missing required fields: email, firstName, lastName, role'
      });
    }

    const allowedRoles = ['admin', 'super_admin'].includes(req.user.role)
      ? ['admin', 'project_manager', 'user']
      : ['user'];

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: `Cannot assign role '${role}'. Allowed: ${allowedRoles.join(', ')}`
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    // Direct active member creation when password is provided
    if (activateImmediately || (password && password.length >= 8)) {
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (!password || password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters for direct member creation' });
      }

      // User.create triggers pre-save password hashing automatically
      const newUser = await User.create({
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        orgId,
        role,
        isActive: true
      });

      org.currentUsers = await User.countDocuments({ orgId, isActive: true });
      await org.save();

      return res.status(201).json({
        message: 'Team member added and activated successfully',
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
        isActive: true
      });
    }

    // Standard email invitation flow
    if (existingUser) {
      if (existingUser.isActive) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      const tempPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 12);
      const newToken = crypto.randomBytes(32).toString('hex');

      await User.updateOne(
        { _id: existingUser._id },
        {
          password: hashedPassword,
          inviteToken: newToken,
          inviteTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      );

      const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/activate/${newToken}`;
      await sendInviteEmail(normalizedEmail, firstName, newToken, org.name, inviteUrl);

      return res.status(200).json({
        message: 'Invitation resent successfully',
        userId: existingUser._id,
        inviteUrl
      });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
    const tempPassword = crypto.randomBytes(8).toString('hex');

    // User.create hashes tempPassword via pre-save hook
    const user = await User.create({
      email: normalizedEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password: tempPassword,
      orgId,
      role,
      inviteToken,
      inviteTokenExpiry: new Date(tokenExpiry),
      isActive: false
    });

    const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/activate/${inviteToken}`;
    await sendInviteEmail(normalizedEmail, firstName, inviteToken, org.name, inviteUrl);

    res.status(201).json({
      message: 'User invited successfully',
      userId: user._id,
      email: user.email,
      role: user.role,
      inviteUrl
    });
  } catch (error) {
    console.error('Error in inviteUser:', error);
    res.status(500).json({
      message: error.message || 'Server error'
    });
  }
};

const getOrgUsers = async (req, res) => {
  try {
    if (!req.user.orgId && req.user.role !== 'super_admin') {
      return res.json([]);
    }

    const query = req.user.orgId ? { orgId: req.user.orgId } : {};
    if (req.query.activeOnly === 'true') {
      query.isActive = true;
    }

    const users = await User.find(query)
      .select('-password -inviteToken -inviteTokenExpiry')
      .sort({ isActive: -1, createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const allowedRoles = ['admin', 'project_manager', 'user'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, orgId: req.user.orgId },
      { role },
      { new: true }
    ).select('-password -inviteToken -inviteTokenExpiry');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot remove your own account' });
    }

    const deleted = await User.findOneAndDelete({
      _id: targetId,
      orgId: req.user.orgId
    });

    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.orgId) {
      const activeCount = await User.countDocuments({ orgId: req.user.orgId, isActive: true });
      await Organization.findByIdAndUpdate(req.user.orgId, { currentUsers: activeCount });
    }

    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  inviteUser,
  getOrgUsers,
  updateUserRole,
  deleteUser,
  getUsers: getOrgUsers
};
