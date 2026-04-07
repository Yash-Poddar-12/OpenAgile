const { runScan } = require('../utils/fileMapEngine');
const DependencyGraph = require('../models/DependencyGraph');
const { v4: uuidv4 } = require('uuid');

/**
 * server/controllers/scanController.js
 * Handles repository dependency scans.
 */

/**
 * GET /api/v1/scan/history
 * Returns historical scan results.
 */
const getScanHistory = async (req, res, next) => {
  try {
    const { days = 7, repoPath } = req.query;
    const filter = { status: 'COMPLETED' };

    if (req.query.repositoryPath) {
      filter.repoPath = req.query.repositoryPath;
    }

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(days));
    filter.scannedAt = { $gte: dateThreshold };

    const scans = await DependencyGraph.find(filter)
      .sort({ scannedAt: -1 })
      .select('graphId repoPath scannedAt nodesCount edgesCount cyclesCount status')
      .lean();

    return res.status(200).json({ scans });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/scan/:id/results
 * Returns the results of a specific scan.
 */
const getResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scan = await DependencyGraph.findOne({ graphId: id }).lean();

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    return res.status(200).json({ 
      status: scan.status, 
      graph: scan.status === 'COMPLETED' ? scan : null,
      error: scan.status === 'FAILED' ? scan.errorMessage || 'Scan failed during processing' : null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/scan
 * Initiates a new repository scan.
 */
const startScan = async (req, res, next) => {
  try {
    const { 
      repositoryPath,
      repositoryUrl,
      fileExtensions = '.js,.ts,.jsx,.tsx', 
      maxDepth = 10, 
      useAST = true,
      includePattern,
      excludePattern,
    } = req.body;

    const actualRepoPath = repositoryPath || repositoryUrl;

    if (!actualRepoPath || !actualRepoPath.trim()) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const graphId = uuidv4();
    const scanConfig = {
      repoPath: actualRepoPath.trim(),
      fileExtensions,
      maxDepth: parseInt(maxDepth),
      useAST,
      includePattern,
      excludePattern,
    };

    // 1. Create initial record
    await DependencyGraph.create({
      graphId,
      repoPath: actualRepoPath.trim(),
      scannedBy: req.user.userId,
      status: 'SCANNING',
      scannedAt: new Date()
    });

    // 2. Return 202 Accepted immediately
    res.status(202).json({ 
      message: 'Scan initiated', 
      scanId: graphId 
    });

    // 3. Background execution
    setImmediate(async () => {
      const io = req.app.get('io');
      const onProgress = (percent, message) => {
        if (io) {
          io.of('/scan').to(graphId).emit('scanProgress', { graphId, percent, message });
        }
      };

      try {
        const result = await runScan(scanConfig, graphId, onProgress);
        if (io) {
          io.of('/scan').to(graphId).emit('scanComplete', { graphId, ...result });
        }
      } catch (err) {
        console.error(`[Scan Engine Error] graphId: ${graphId}`, err);
        await DependencyGraph.findOneAndUpdate(
          { graphId }, 
          { status: 'FAILED', errorMessage: err.message }
        );
        if (io) {
          io.of('/scan').to(graphId).emit('scanFailed', { graphId, error: err.message });
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startScan,
  getResults,
  getScanHistory
};
