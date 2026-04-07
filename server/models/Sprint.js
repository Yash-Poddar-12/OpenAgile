const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const sprintSchema = new mongoose.Schema(
  {
    sprintId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    projectId: {
      type: String,
      required: [true, 'Project ID is required'],
      // ref: Project.projectId
    },
    name: {
      type: String,
      required: [true, 'Sprint name is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PLANNED', 'ACTIVE', 'CLOSED'],
      default: 'PLANNED',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// Index on projectId
sprintSchema.index({ projectId: 1 });

// Custom validation: endDate must be after startDate
sprintSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
  next();
});

const Sprint = mongoose.model('Sprint', sprintSchema);

module.exports = Sprint;
