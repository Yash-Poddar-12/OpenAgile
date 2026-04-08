const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const commentSchema = new mongoose.Schema(
  {
    commentId: {
      type: String,
      default: uuidv4,
    },
    authorId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    issueId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    projectId: {
      type: String,
      required: [true, 'Project ID is required'],
      // ref: Project.projectId
    },
    sprintId: {
      type: String,
      default: null,
      // ref: Sprint.sprintId, nullable
    },
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['ToDo', 'InProgress', 'Review', 'Done'],
      default: 'ToDo',
    },
    assigneeId: {
      type: String,
      default: null,
      // ref: User.userId, nullable
    },
    createdBy: {
      type: String,
      required: [true, 'Creator ID is required'],
      // ref: User.userId
    },
    dueDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  { versionKey: false }
);

// Indexes: projectId, sprintId, assigneeId, status
issueSchema.index({ projectId: 1 });
issueSchema.index({ sprintId: 1 });
issueSchema.index({ assigneeId: 1 });
issueSchema.index({ status: 1 });

// Pre-save hook: update updatedAt on every save
issueSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
