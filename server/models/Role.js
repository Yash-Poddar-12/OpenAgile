const mongoose = require('mongoose');

// Nested permissions sub-schema
const permissionsSchema = new mongoose.Schema(
  {
    fileMapScan: { type: Boolean, default: false },
    viewProjects: { type: Boolean, default: false },
    editIssues: { type: Boolean, default: false },
    kanban: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
    adminPanel: { type: Boolean, default: false },
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      // hex color string e.g. '#EF4444'
    },
    memberCount: {
      type: Number,
      default: 0,
    },
    permissions: {
      type: permissionsSchema,
      default: () => ({}),
    },
  },
  { versionKey: false }
);

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
