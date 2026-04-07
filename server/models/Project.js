const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    ownerId: {
      type: String,
      required: [true, 'Owner ID is required'],
      // ref: User.userId
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [120, 'Project name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    repositoryPath: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// Index on ownerId for PM dashboard query
projectSchema.index({ ownerId: 1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
