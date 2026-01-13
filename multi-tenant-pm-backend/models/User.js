// // models/User.js
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//     match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: 8
//   },
//   firstName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   lastName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   orgId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Organization',
//     required: function() { return this.role !== 'super_admin'; }
//   },
//   role: {
//     type: String,
//     enum: ['super_admin', 'admin', 'project_manager', 'user'],
//     required: true,
//     default: 'user'
//   },
//   isActive: {
//     type: Boolean,
//     default: false
//   },
//   inviteToken: {
//     type: String,
//     default: null
//   },
//   inviteTokenExpiry: {
//     type: Date,
//     default: null
//   },
//   avatar: {
//     type: String,
//     default: null
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// }, {
//   timestamps: true
// });

// // Hash password before save
// // userSchema.pre('save', async function(next) {
// //   if (!this.isModified('password')) return next();
// //   this.password = await bcrypt.hash(this.password, 12);
// //  //  next();
// // });
// // Hash password before save
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   try {
//     this.password = await bcrypt.hash(this.password, 12);
//     next(); // ✅ Remove the comment slashes!
//   } catch (error) {
//     next(error); // ✅ Also add error handling
//   }
// });
// // Compare password method
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// userSchema.index({ email: 1 });
// userSchema.index({ orgId: 1, role: 1 });

// module.exports = mongoose.model('User', userSchema);



// models/User.js - CORRECTED VERSION
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() { return this.role !== 'super_admin'; }
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'project_manager', 'user'],
    required: true,
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  inviteToken: {
    type: String,
    default: null
  },
  inviteTokenExpiry: {
    type: Date,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ✅ CORRECTED: Hash password before save
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ email: 1 });
userSchema.index({ orgId: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);