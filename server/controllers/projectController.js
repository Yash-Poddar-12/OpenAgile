const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const Issue = require('../models/Issue');
const ActivityLog = require('../models/ActivityLog');

/**
 * createProject(req, res)
 * requireRole: Admin, ProjectManager
 * Validates name, description, ownerId, and logs activity.
 */
const createProject = async (req, res, next) => {
  try {
    const { name, description, repositoryPath } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    if (name.length > 120) {
      return res.status(400).json({ error: 'Project name cannot exceed 120 characters' });
    }

    const project = new Project({
      name: name.trim(),
      description: description ? description.trim() : '',
      repositoryPath: repositoryPath ? repositoryPath.trim() : '',
      ownerId: req.user.userId,
    });

    await project.save();

    // Log Activity
    await ActivityLog.create({
      entityType: 'Project',
      entityId: project.projectId,
      action: 'PROJECT_CREATED',
      performedBy: req.user.userId,
      details: { name: project.name },
    });

    return res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
};

/**
 * listProjects(req, res)
 * requireRole: all authenticated
 * Admin/PM: all projects. Others: owned or assigned to an issue.
 */
const listProjects = async (req, res, next) => {
  try {
    const { status } = req.query;
    const { role, userId } = req.user;

    let query = {};
    if (status) query.status = status;

    // RBAC filtering
    if (role !== 'Admin' && role !== 'ProjectManager') {
      // Find issues assigned to this user to get project IDs
      const assignedIssues = await Issue.find({ assigneeId: userId }).select('projectId');
      const assignedProjectIds = assignedIssues.map((i) => i.projectId);

      query = {
        ...query,
        $or: [
          { ownerId: userId },
          { projectId: { $in: assignedProjectIds } },
        ],
      };
    }

    const projects = await Project.find(query).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ projects });
  } catch (err) {
    next(err);
  }
};

/**
 * getProject(req, res)
 * Returns project with sprints and open issue count.
 */
const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({ projectId: id }).lean();
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get sprints
    const sprints = await Sprint.find({ projectId: id }).sort({ startDate: 1 }).lean();

    // Get open issue count (status !== 'Done')
    const issueCount = await Issue.countDocuments({
      projectId: id,
      status: { $ne: 'Done' },
    });

    return res.status(200).json({ project, sprints, issueCount });
  } catch (err) {
    next(err);
  }
};

/**
 * archiveProject(req, res)
 * requireRole: Admin, ProjectManager
 * Restrict to owner or Admin.
 */
const archiveProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user;

    const project = await Project.findOne({ projectId: id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check authority: Admin or Owner
    if (role !== 'Admin' && project.ownerId !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions to archive this project' });
    }

    project.status = 'ARCHIVED';
    await project.save();

    // Log Activity
    await ActivityLog.create({
      entityType: 'Project',
      entityId: project.projectId,
      action: 'PROJECT_ARCHIVED',
      performedBy: userId,
    });

    return res.status(200).json({ project });
  } catch (err) {
    next(err);
  }
};

/**
 * updateProject(req, res)
 * requireRole: Admin, ProjectManager
 */
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, repositoryPath } = req.body;
    const { role, userId } = req.user;

    const project = await Project.findOne({ projectId: id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (role !== 'Admin' && project.ownerId !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (repositoryPath !== undefined) project.repositoryPath = repositoryPath.trim();

    await project.save();

    await ActivityLog.create({
      entityType: 'Project',
      entityId: project.projectId,
      action: 'PROJECT_UPDATED',
      performedBy: userId,
    });

    return res.status(200).json({ project });
  } catch (err) {
    next(err);
  }
};

/**
 * unarchiveProject(req, res)
 * requireRole: Admin, ProjectManager
 */
const unarchiveProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user;

    const project = await Project.findOne({ projectId: id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (role !== 'Admin' && project.ownerId !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    project.status = 'ACTIVE';
    await project.save();

    await ActivityLog.create({
      entityType: 'Project',
      entityId: project.projectId,
      action: 'PROJECT_UNARCHIVED',
      performedBy: userId,
    });

    return res.status(200).json({ project });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProject,
  listProjects,
  getProject,
  archiveProject,
  updateProject,
  unarchiveProject,
};
