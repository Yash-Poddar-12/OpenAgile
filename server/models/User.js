const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['Admin', 'ProjectManager', 'Developer', 'RepoAnalyst', 'Viewer'],
      default: 'Viewer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// Pre-save hook: hash the password into passwordHash using bcrypt saltRounds 12
userSchema.pre('save', async function (next) {
  // Only hash if the passwordHash field is being set for the first time or modified
  // We treat the raw password as stored temporarily in a virtual; here we check
  // if passwordHash looks unhashed (not starting with $2b$)
  if (!this.isModified('passwordHash')) {
    return next();
  }

  // If already a bcrypt hash, skip
  if (this.passwordHash && this.passwordHash.startsWith('$2b$')) {
    return next();
  }

  try {
    this.passwordHash = await bcrypt.hash(this.passwordHash, SALT_ROUNDS);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method: comparePassword(plain) → boolean
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Static method: findByEmail(email) → User | null
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
