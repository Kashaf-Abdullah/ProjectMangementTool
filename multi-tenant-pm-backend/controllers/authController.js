// controllers/authController.js
const User = require('../models/User');

const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// ADD THIS NEW ENDPOINT
const getProfile = async (req, res) => {
  try {
        const user = await User.findById(req.user._id).select('-password');
    // const user = await User.findById(req.user.id).populate('orgId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      orgId: user.orgId._id,
      orgName: user.orgId.name,
      userLimit: user.orgId.userLimit,
      currentUsers: user.orgId.currentUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create organization
    const organization = await Organization.create({
      name: companyName || `${firstName}'s Team`,
      userLimit: 5,
      currentUsers: 1
    });

    // Create user (first user becomes admin)
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      orgId: organization._id,
      role: 'admin', // First user is admin
      isActive: true
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        orgId: user.orgId,
        orgName: organization.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      email,
      password,
      firstName,
      lastName,
      role: 'super_admin',
      isActive: true,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
const registerOrgAdmin = async (req, res) => {
  try {
    // authorize('super_admin') middleware already ensure karega
    const { email, password, firstName, lastName, orgId } = req.body;

    if (!orgId) {
      return res.status(400).json({ message: 'orgId is required' });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      orgId,
      role: 'admin',
      isActive: true,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email }).select('+password');
//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     if (!user.isActive) {
//       return res.status(403).json({ message: 'Account not activated' });
//     }

//     const token = generateToken(user._id);
//     const userData = {
//       id: user._id,
//       email: user.email,
//       role: user.role,
//       orgId: user.orgId,
//       firstName: user.firstName,
//       lastName: user.lastName
//     };

//     res.json({ token, user: userData });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with organization
    const user = await User.findOne({ email })
      .populate({
        path: 'orgId',
        select: 'name userLimit currentUsers'
      });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account not activated' });
    }

    // SAFE orgId handling
    const orgId = user.orgId?._id || null;
    const orgName = user.orgId?.name || 'No Organization';
    const userLimit = user.orgId?.userLimit || 5;
    const currentUsers = user.orgId?.currentUsers || 1;

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role.toLowerCase(),  // ✅ Force lowercase
        orgId: orgId,
        firstName: user.firstName,
        orgName,
        userLimit,
        currentUsers
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName || 'User',
        lastName: user.lastName || '',
        role: user.role.toLowerCase(),  // ✅ 'admin', 'superadmin'
        orgId: orgId,
        orgName,
        userLimit,
        currentUsers
      }
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};



const registerUser = async (req, res) => {
  try {
    // Sirf org admin / project_manager allow (authorize middleware check karega)
    const { email, password, firstName, lastName } = req.body;

    const orgId = req.user.orgId;
    if (!orgId) {
      return res.status(403).json({ message: 'Organization access required' });
    }

    // User limit check (middleware already karega, double check)
    const org = await Organization.findById(orgId);
    const currentUsers = await User.countDocuments({ orgId, isActive: true });
    if (currentUsers >= org.userLimit) {
      return res.status(403).json({ 
        message: 'User limit reached. Upgrade plan first.',
        currentUsers,
        userLimit: org.userLimit 
      });
    }

    // Email already exists?
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      email,
      password,           // ← ye required hai register me
      firstName,
      lastName,
      orgId,
      role: 'user',       // default user role
      isActive: true      // register se direct active
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};




// const activateUser = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     console.log('=== ACTIVATION ATTEMPT ===');
//     console.log('Token:', token);
//     console.log('Password provided:', password ? 'Yes' : 'No');

//     // Validate token exists
//     if (!token || token.length !== 64) { // assuming 64 char token
//       return res.status(400).json({ 
//         message: 'Invalid invitation token. Please request a new invitation.' 
//       });
//     }

//     // Find user by invite token
//     const user = await User.findOne({ 
//       inviteToken: token,
//       isActive: false 
//     });

//     console.log('User found:', user ? user.email : 'No');

//     if (!user) {
//       // Check if user exists but is already active
//       const alreadyActiveUser = await User.findOne({ inviteToken: token });
//       if (alreadyActiveUser) {
//         return res.status(400).json({ 
//           message: 'Account already activated. Please login.' 
//         });
//       }
      
//       return res.status(400).json({ 
//         message: 'Invalid invitation token. Please request a new invitation.' 
//       });
//     }

//     // Check token expiry
//     if (new Date() > user.inviteTokenExpiry) {
//       return res.status(400).json({ 
//         message: 'Invitation link has expired. Please request a new invitation.' 
//       });
//     }

//     // Check if password is provided
//     if (!password) {
//       // Return token is valid but password needed
//       return res.status(200).json({
//         valid: true,
//         email: user.email,
//         firstName: user.firstName,
//         message: 'Token valid. Please set your password.'
//       });
//     }

//     // Validate password
//     if (password.length < 8) {
//       return res.status(400).json({ 
//         message: 'Password must be at least 8 characters' 
//       });
//     }

//     // ✅ HASH the password before saving
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Activate user
//     user.password = hashedPassword;  // Use hashed password
//     user.isActive = true;
//     user.inviteToken = null;
//     user.inviteTokenExpiry = null;
//     await user.save();

//     console.log('User activated successfully:', user.email);

//     // Generate login token
//     const jwtToken = generateToken(user._id);
    
//     res.json({
//       message: 'Account activated successfully',
//       token: jwtToken,
//       user: {
//         id: user._id,
//         email: user.email,
//         role: user.role,
//         orgId: user.orgId,
//         firstName: user.firstName,
//         lastName: user.lastName
//       }
//     });

//   } catch (error) {
//     console.error('Error in activateUser:', error);
//     res.status(500).json({ 
//       message: 'Activation failed',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

const activateUser = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log('=== ACTIVATION ATTEMPT ===');
    console.log('Token:', token);
    console.log('Password provided:', password ? 'Yes' : 'No');

    // Validate token
    if (!token) {
      return res.status(400).json({ 
        message: 'Invalid invitation token.' 
      });
    }

    // Find user
    const user = await User.findOne({ 
      inviteToken: token,
      isActive: false 
    });

    console.log('User found:', user ? user.email : 'No');

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid invitation token. Please request a new invitation.' 
      });
    }

    // Check expiry
    if (new Date() > user.inviteTokenExpiry) {
      return res.status(400).json({ 
        message: 'Invitation link has expired. Please request a new invitation.' 
      });
    }

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters' 
      });
    }

    // ✅ OPTION A: Hash manually and save without triggering pre-save
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Use direct update to bypass pre-save middleware
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

    console.log('User activated successfully:', user.email);

    // Generate token
    const jwtToken = generateToken(user._id);
    
    res.json({
      message: 'Account activated successfully',
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Error in activateUser:', error);
    res.status(500).json({ 
      message: 'Activation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
module.exports = {activateUser, register,registerSuperAdmin,registerOrgAdmin, login,registerUser,getProfile };
