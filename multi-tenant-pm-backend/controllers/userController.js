// controllers/userController.js (COMPLETE VERSION)
const User = require('../models/User');
const Organization = require('../models/Organization');
const crypto = require('crypto');
const { sendInviteEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');
const bcrypt=require('bcrypt');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// const inviteUser = async (req, res) => {
//   try {
//     const orgId = req.user.orgId;
//     const org = await Organization.findById(orgId);

//     const currentUsers = await User.countDocuments({ 
//       orgId, 
//       isActive: true 
//     });

//     // userLimit already checked by middleware, but double-check
//     if (currentUsers >= org.userLimit) {
//       return res.status(403).json({ 
//         message: 'User limit reached. Upgrade plan first.',
//         currentUsers,
//         userLimit: org.userLimit 
//       });
//     }

//     const { email, firstName, lastName, role } = req.body;
    
//     // Role validation based on inviter's role
//     const allowedRoles = req.user.role === 'admin' 
//       ? ['admin', 'project_manager', 'user'] 
//       : ['user'];

//     if (!allowedRoles.includes(role)) {
//       return res.status(403).json({ 
//         message: `Cannot assign role '${role}'. Allowed: ${allowedRoles.join(', ')}` 
//       });
//     }

//     // Check if email already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser && existingUser.isActive) {
//       return res.status(400).json({ message: 'Email already registered' });
//     }

//     const inviteToken = crypto.randomBytes(32).toString('hex');
//     const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

//     const user = await User.create({
//       email,
//       firstName,
//       lastName,
//       orgId,
//       role,
//       inviteToken,
//       inviteTokenExpiry: new Date(tokenExpiry),
//       isActive: false
//     });

//     // Send invitation email
//     const inviteUrl = `${process.env.CLIENT_URL}/activate/${inviteToken}`;
//     await sendInviteEmail(email, firstName, inviteToken, org.name, inviteUrl);

//     // Update org currentUsers count
//     org.currentUsers = currentUsers + 1;
//     await org.save();

//     res.status(201).json({ 
//       message: 'User invited successfully',
//       userId: user._id,
//       email: user.email,
//       role: user.role
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// const inviteUser = async (req, res) => {
//   try {
//     const orgId = req.user.orgId;
//     const org = await Organization.findById(orgId);

//     if (!org) {
//       return res.status(404).json({ message: 'Organization not found' });
//     }

//     const currentUsers = await User.countDocuments({ 
//       orgId, 
//       isActive: true 
//     });

//     // Check user limit (just in case middleware didn't catch it)
//     const userLimit = org.userLimit || 5;
//     if (currentUsers >= userLimit) {
//       return res.status(403).json({ 
//         message: 'User limit reached. Upgrade plan first.',
//         currentUsers,
//         userLimit,
//         upgradeRequired: true
//       });
//     }

//     const { email, firstName, lastName, role } = req.body;
    
//     // Validate required fields
//     if (!email || !firstName || !lastName || !role) {
//       return res.status(400).json({ 
//         message: 'Missing required fields: email, firstName, lastName, role' 
//       });
//     }

//     // Role validation based on inviter's role
//     const allowedRoles = req.user.role === 'admin' 
//       ? ['admin', 'project_manager', 'user'] 
//       : ['user'];

//     if (!allowedRoles.includes(role)) {
//       return res.status(403).json({ 
//         message: `Cannot assign role '${role}'. Allowed: ${allowedRoles.join(', ')}` 
//       });
//     }

//     // Check if email already exists (active or inactive)
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       if (existingUser.isActive) {
//         return res.status(400).json({ message: 'Email already registered' });
//       } else {
//         // User exists but is inactive - resend invitation
//         existingUser.inviteToken = crypto.randomBytes(32).toString('hex');
//         existingUser.inviteTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
//         await existingUser.save();
        
//         // Resend invitation email
//         const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/activate/${existingUser.inviteToken}`;
//         await sendInviteEmail(email, firstName, existingUser.inviteToken, org.name, inviteUrl);
        
//         return res.status(200).json({ 
//           message: 'Invitation resent successfully',
//           userId: existingUser._id
//         });
//       }
//     }

//     const inviteToken = crypto.randomBytes(32).toString('hex');
//     const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

//     // Create temporary password that will be changed on activation
//     const tempPassword = crypto.randomBytes(8).toString('hex');
    
//     const user = await User.create({
//       email,
//       firstName,
//       lastName,
//       password: tempPassword, // Add password field
//       orgId,
//       role,
//       inviteToken,
//       inviteTokenExpiry: new Date(tokenExpiry),
//       isActive: false
//     });

//     // Send invitation email
//     const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/activate/${inviteToken}`;
//     await sendInviteEmail(email, firstName, inviteToken, org.name, inviteUrl);

//     // Update org currentUsers count (optional - you might want to track active users only)
//     org.currentUsers = (org.currentUsers || 0) + 1;
//     await org.save();

//     res.status(201).json({ 
//       message: 'User invited successfully',
//       userId: user._id,
//       email: user.email,
//       role: user.role
//     });

//   } catch (error) {
//     console.error('Error in inviteUser:', error);
//     res.status(500).json({ 
//       message: 'Server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };


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

    // Check user limit
    const userLimit = org.userLimit || 5;
    if (currentUsers >= userLimit) {
      return res.status(403).json({ 
        message: 'User limit reached. Upgrade plan first.',
        currentUsers,
        userLimit,
        upgradeRequired: true
      });
    }

    const { email, firstName, lastName, role } = req.body;
    
    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        message: 'Missing required fields: email, firstName, lastName, role' 
      });
    }

    // Role validation
    const allowedRoles = req.user.role === 'admin' 
      ? ['admin', 'project_manager', 'user'] 
      : ['user'];

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        message: `Cannot assign role '${role}'. Allowed: ${allowedRoles.join(', ')}` 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isActive) {
        return res.status(400).json({ message: 'Email already registered' });
      } else {
        // User exists but is inactive - resend invitation
        
        // ✅ FIX: Hash password manually
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        
        const newToken = crypto.randomBytes(32).toString('hex');
        
        // ✅ FIX: Use updateOne instead of save() to avoid pre-save hook
        await User.updateOne(
          { _id: existingUser._id },
          {
            password: hashedPassword,
            inviteToken: newToken,
            inviteTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        );
        
        // Resend invitation email
        const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/activate/${newToken}`;
        await sendInviteEmail(email, firstName, newToken, org.name, inviteUrl);
        
        return res.status(200).json({ 
          message: 'Invitation resent successfully',
          userId: existingUser._id
        });
      }
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    // ✅ FIX: Hash password manually before creating user
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    
    const user = await User.create({
      email,
      firstName,
      lastName,
      password: hashedPassword, // Already hashed
      orgId,
      role,
      inviteToken,
      inviteTokenExpiry: new Date(tokenExpiry),
      isActive: false
    });

    // Send invitation email
    const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/activate/${inviteToken}`;
    await sendInviteEmail(email, firstName, inviteToken, org.name, inviteUrl);

    // Update org currentUsers count
    org.currentUsers = (org.currentUsers || 0) + 1;
    await org.save();

    res.status(201).json({ 
      message: 'User invited successfully',
      userId: user._id,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    console.error('Error in inviteUser:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message // Show actual error
    });
  }
};
// const activateUser = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const user = await User.findOne({ 
//       inviteToken: token, 
//       inviteTokenExpiry: { $gt: Date.now() },
//       isActive: false
//     });

//     if (!user) {
//       return res.status(400).json({ 
//         message: 'Invalid or expired invitation token' 
//       });
//     }

//     // Activate user
//     user.isActive = true;
//     user.inviteToken = null;
//     user.inviteTokenExpiry = null;
    
//     // Generate password hash (user will set password on frontend)
//     await user.save();

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
//     res.status(500).json({ message: error.message });
//   }
// };

const getOrgUsers = async (req, res) => {
  try {
    const users = await User.find({ 
      orgId: req.user.orgId,
      isActive: true 
    })
    .select('-password -inviteToken -inviteTokenExpiry')
    .sort({ createdAt: -1 });
    
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
      { _id: userId, orgId: req.user.orgId, isActive: true },
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// controllers/userController.js
const getUsers = async (req, res) => {
  try {
    // Check if user has orgId
    if (!req.user.orgId) {
      return res.status(403).json({ message: 'Organization not assigned' });
    }

    const users = await User.find({ 
      orgId: req.user.orgId 
    }).select('-password');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { 
  inviteUser, 
  // activateUser, 
  getOrgUsers,
  updateUserRole ,
  getUsers
};
