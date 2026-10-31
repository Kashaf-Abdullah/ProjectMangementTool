const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'pm_tool_fallback_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const formatUserPayload = (user, orgDoc = null) => {
  const org = orgDoc || (user.orgId && user.orgId._id ? user.orgId : null);
  const orgId = org ? org._id : (user.orgId || null);
  return {
    _id: user._id,
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.toLowerCase(),
    orgId,
    orgName: org?.name || 'Organization',
    userLimit: org?.userLimit || 5,
    currentUsers: org?.currentUsers || 1
  };
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('orgId', 'name userLimit currentUsers');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let currentUsers = user.orgId?.currentUsers || 1;
    if (user.orgId?._id) {
      currentUsers = await User.countDocuments({ orgId: user.orgId._id, isActive: true });
    }

    res.json({
      ...formatUserPayload(user),
      currentUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;

    const existingUser = await User.findOne({ email: email?.toLowerCase()?.trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const organization = await Organization.create({
      name: companyName || `${firstName}'s Workspace`,
      userLimit: 10,
      currentUsers: 1
    });

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      firstName,
      lastName,
      orgId: organization._id,
      role: 'admin',
      isActive: true
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: formatUserPayload(user, organization)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: error.message || 'Registration failed'
    });
  }
};

const registerSuperAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      return res.status(400).json({ message: 'Super admin already exists' });
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      firstName,
      lastName,
      role: 'super_admin',
      isActive: true
    });

    const token = generateToken(user._id);
    return res.status(201).json({
      token,
      user: formatUserPayload(user)
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const registerOrgAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, orgId } = req.body;
    if (!orgId) {
      return res.status(400).json({ message: 'orgId is required' });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      firstName,
      lastName,
      orgId,
      role: 'admin',
      isActive: true
    });

    const token = generateToken(user._id);
    return res.status(201).json({
      token,
      user: formatUserPayload(user, org)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase()?.trim() })
      .populate({
        path: 'orgId',
        select: 'name userLimit currentUsers'
      });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account not activated yet' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: formatUserPayload(user)
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const registerUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    const orgId = req.user.orgId;

    if (!orgId) {
      return res.status(403).json({ message: 'Organization access required' });
    }

    const org = await Organization.findById(orgId);
    const currentUsers = await User.countDocuments({ orgId, isActive: true });

    if (currentUsers >= org.userLimit) {
      return res.status(403).json({
        message: 'User limit reached. Upgrade plan first.',
        currentUsers,
        userLimit: org.userLimit
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const assignedRole = ['admin', 'project_manager', 'user'].includes(role) ? role : 'user';

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      firstName,
      lastName,
      orgId,
      role: assignedRole,
      isActive: true
    });

    const token = generateToken(user._id);
    return res.status(201).json({
      token,
      user: formatUserPayload(user, org)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const activateUser = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Invalid invitation token.' });
    }

    const user = await User.findOne({
      inviteToken: token,
      isActive: false
    }).populate('orgId', 'name userLimit currentUsers');

    if (!user) {
      return res.status(400).json({
        message: 'Invalid invitation token. Please request a new invitation.'
      });
    }

    if (user.inviteTokenExpiry && new Date() > user.inviteTokenExpiry) {
      return res.status(400).json({
        message: 'Invitation link has expired. Please request a new invitation.'
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters'
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          isActive: true,
          inviteToken: null,
          inviteTokenExpiry: null
        }
      }
    );

    if (user.orgId?._id) {
      const count = await User.countDocuments({ orgId: user.orgId._id, isActive: true });
      await Organization.findByIdAndUpdate(user.orgId._id, { currentUsers: count });
    }

    const jwtToken = generateToken(user._id);

    res.json({
      message: 'Account activated successfully',
      token: jwtToken,
      user: formatUserPayload(user)
    });
  } catch (error) {
    console.error('Error in activateUser:', error);
    res.status(500).json({ message: 'Activation failed' });
  }
};

module.exports = {
  activateUser,
  register,
  registerSuperAdmin,
  registerOrgAdmin,
  login,
  registerUser,
  getProfile
};
