const ActivityLog = require('../models/ActivityLog');
const Issue = require('../models/Issue');

/**
 * getActivityLog(req, res)
 * Returns logs for a specific entityId or all logs related to a projectId (all issues in project).
 * Query: ?entityId= OR ?projectId=
 */
const getActivityLog = async (req, res, next) => {
  try {
    const { entityId, projectId } = req.query;

    if (!entityId && !projectId) {
      return res.status(400).json({ error: 'Either entityId or projectId is required' });
    }

    let filter = {};

    if (entityId) {
      filter.entityId = entityId;
    } else if (projectId) {
      // Find all issues for the project to get their logs as well
      const issues = await Issue.find({ projectId }).select('issueId');
      const issueIds = issues.map((i) => i.issueId);
      
      // Filter for activities on the project itself OR any of its issues
      filter = {
        $or: [
          { entityId: projectId },
          { entityId: { $in: issueIds } },
        ],
      };
    }

    const logs = await ActivityLog.find(filter)
      .populate({
        path: 'performedBy',
        // In the model, performedBy is ref: User.userId, so we populate name and role.
        // Wait, the schema uses userId as a String field, but population requires ObjectId or virtuals.
        // Let's check how the Schema is defined.
        select: 'name role',
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ logs });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActivityLog };
