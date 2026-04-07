const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Sub-schema for individual graph nodes
const nodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['Core', 'Util', 'API', 'Cyclic'],
      default: 'Core',
    },
    fanIn: { type: Number, default: 0 },
    fanOut: { type: Number, default: 0 },
  },
  { _id: false }
);

// Sub-schema for graph edges
const edgeSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    target: { type: String, required: true },
  },
  { _id: false }
);

// Sub-schema for fan-in/fan-out top-5 entries
const topFileSchema = new mongoose.Schema(
  {
    file: { type: String, required: true },
    count: { type: Number, required: true },
  },
  { _id: false }
);

const dependencyGraphSchema = new mongoose.Schema(
  {
    graphId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    repoPath: {
      type: String,
      required: [true, 'Repository path is required'],
    },
    errorMessage: {
      type: String,
    },
    status: {
      type: String,
      enum: ['SCANNING', 'COMPLETED', 'FAILED'],
      default: 'SCANNING',
    },
    nodesCount: {
      type: Number,
      default: 0,
    },
    edgesCount: {
      type: Number,
      default: 0,
    },
    cyclesCount: {
      type: Number,
      default: 0,
    },
    nodes: {
      type: [nodeSchema],
      default: [],
    },
    edges: {
      type: [edgeSchema],
      default: [],
    },
    fanInTop5: {
      type: [topFileSchema],
      default: [],
    },
    fanOutTop5: {
      type: [topFileSchema],
      default: [],
    },
    dotContent: {
      type: String,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
    scannedBy: {
      type: String,
      // ref: User.userId
    },
  },
  { versionKey: false }
);

// Compound index: status + scannedAt (for analytics queries)
dependencyGraphSchema.index({ status: 1, scannedAt: -1 });

const DependencyGraph = mongoose.model('DependencyGraph', dependencyGraphSchema);

module.exports = DependencyGraph;
