const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const activityLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    entityType: {
      type: String,
      enum: ['Issue', 'Sprint', 'Project'],
      required: [true, 'Entity type is required'],
    },
    entityId: {
      type: String,
      required: [true, 'Entity ID is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      // e.g. 'STATUS_CHANGED', 'ISSUE_CREATED', 'SPRINT_ACTIVATED'
    },
    performedBy: {
      type: String,
      required: [true, 'Performer ID is required'],
      // ref: User.userId
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      // Optional JSON: { from, to, field, ... }
    },
  },
  { versionKey: false }
);

// Indexes: entityId, performedBy, timestamp
activityLogSchema.index({ entityId: 1 });
activityLogSchema.index({ performedBy: 1 });
activityLogSchema.index({ timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
