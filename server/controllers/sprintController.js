const Sprint = require('../models/Sprint');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');

/**
 * createSprint(req, res)
 * requireRole: Admin, ProjectManager
 * Validates projectId, name, and dates.
 */
const createSprint = async (req, res, next) => {
  try {
    const { projectId, name, startDate, endDate } = req.body;

    if (!projectId || !name) {
      return res.status(400).json({ error: 'Project ID and name are required' });
    }

    // Verify project exists
    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const sprint = new Sprint({
      projectId,
      name: name.trim(),
      startDate,
      endDate,
      status: 'PLANNED',
    });

    await sprint.save();

    // Log Activitiy
    await ActivityLog.create({
      entityType: 'Sprint',
      entityId: sprint.sprintId,
      action: 'SPRINT_CREATED',
      performedBy: req.user.userId,
      details: { name: sprint.name, projectId },
    });

    return res.status(201).json({ sprint });
  } catch (err) {
    // Schema validation handles Date verification
    next(err);
  }
};

/**
 * listSprints(req, res)
 * requireRole: all authenticated
 * Query: ?projectId= (required)
 */
const listSprints = async (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const sprints = await Sprint.find({ projectId }).sort({ startDate: 1 }).lean();
    return res.status(200).json({ sprints });
  } catch (err) {
    next(err);
  }
};

/**
 * activateSprint(req, res)
 * requireRole: Admin, ProjectManager
 * Ensures no other ACTIVE sprint for the project.
 */
const activateSprint = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sprint = await Sprint.findOne({ sprintId: id });
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    // Check for existing ACTIVE sprint in the same project
    const activeSprint = await Sprint.findOne({ 
      projectId: sprint.projectId, 
      status: 'ACTIVE' 
    });

    if (activeSprint) {
      return res.status(400).json({ 
        error: `Sprint '${activeSprint.name}' is already active. Close it first.` 
      });
    }

    sprint.status = 'ACTIVE';
    // Record start date if not set
    if (!sprint.startDate) {
      sprint.startDate = new Date();
    }
    
    await sprint.save();

    // Log Activity
    await ActivityLog.create({
      entityType: 'Sprint',
      entityId: sprint.sprintId,
      action: 'SPRINT_ACTIVATED',
      performedBy: req.user.userId,
    });

    return res.status(200).json({ sprint });
  } catch (err) {
    next(err);
  }
};

/**
 * closeSprint(req, res)
 * requireRole: Admin, ProjectManager
 * Sets sprint status to CLOSED.
 */
const closeSprint = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sprint = await Sprint.findOne({ sprintId: id });
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    sprint.status = 'CLOSED';
    // Record end date as now if not set
    if (!sprint.endDate) {
      sprint.endDate = new Date();
    }

    await sprint.save();

    // Log Activity
    await ActivityLog.create({
      entityType: 'Sprint',
      entityId: sprint.sprintId,
      action: 'SPRINT_CLOSED',
      performedBy: req.user.userId,
    });

    return res.status(200).json({ sprint });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSprint,
  listSprints,
  activateSprint,
  closeSprint,
};
