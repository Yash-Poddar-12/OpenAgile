const DependencyGraph = require('../models/DependencyGraph');

/**
 * server/controllers/analyticsController.js
 * Aggregates repository scan metrics and trends.
 */

const getAnalytics = async (req, res, next) => {
  try {
    const { days = 7, repoPath } = req.query;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(days));

    const query = {
      status: 'COMPLETED',
      scannedAt: { $gte: dateThreshold }
    };

    if (repoPath) {
      query.repoPath = repoPath;
    }

    // 1. Fetch total COMPLETED scans
    const totalScans = await DependencyGraph.countDocuments(query);

    // 2. Aggregate average stats
    const stats = await DependencyGraph.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgCycles: { $avg: '$cyclesCount' },
          totalNodes: { $sum: '$nodesCount' },
          totalEdges: { $sum: '$edgesCount' }
        }
      }
    ]);

    const avgCyclesDetected = stats.length > 0 ? Math.round(stats[0].avgCycles * 10) / 10 : 0;

    // 3. Find most scanned repository
    const repoRanking = await DependencyGraph.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$repoPath',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const mostScannedRepo = repoRanking.length > 0 ? repoRanking[0]._id : 'None';

    // 4. Trend: Cycles per Day
    const trend = await DependencyGraph.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } },
          cycles: { $sum: '$cyclesCount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          cycles: 1,
          count: 1
        }
      }
    ]);

    // 5. History: List of recent scans for the analytics table
    const history = await DependencyGraph.find(query)
      .sort({ scannedAt: -1 })
      .select('graphId repoPath scannedAt nodesCount edgesCount cyclesCount status')
      .limit(20)
      .lean();

    return res.status(200).json({
      totalScans,
      avgCyclesDetected,
      mostScannedRepo,
      trend,
      history
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAnalytics };
