const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const recentExportSchema = new mongoose.Schema(
  {
    exportId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
    },
    artifactTypes: {
      type: [String],
      default: [],
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    generatedBy: {
      type: String,
      required: [true, 'Generator user ID is required'],
      // ref: User.userId
    },
    projectId: {
      type: String,
      // ref: Project.projectId
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// Indexes: generatedBy, generatedAt
recentExportSchema.index({ generatedBy: 1 });
recentExportSchema.index({ generatedAt: -1 });

const RecentExport = mongoose.model('RecentExport', recentExportSchema);

module.exports = RecentExport;
