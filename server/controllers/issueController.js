const Issue = require('../models/Issue');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const VALID_STATUSES = ['ToDo', 'InProgress', 'Review', 'Done'];
const VALID_PRIORITIES = ['High', 'Medium', 'Low'];

const normalizeNullableField = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '' || value === 'null') {
    return null;
  }

  return value;
};

/**
 * listIssues(req, res)
 * Support filters, search, and sorting.
 * requireRole: all authenticated
 */
const listIssues = async (req, res, next) => {
  try {
    const { projectId, sprintId, assigneeId, priority, status, search, sort } = req.query;

    const query = { isDeleted: false };

    if (projectId) query.projectId = projectId;
    if (sprintId) query.sprintId = sprintId === 'null' ? null : sprintId;
    if (assigneeId) query.assigneeId = assigneeId === 'null' ? null : assigneeId;
    if (priority) query.priority = priority;
    if (status) query.status = status;

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    if (sort) {
      const [field, order] = sort.split(':');
      const sortFieldMap = {
        id: 'issueId',
        issueId: 'issueId',
        title: 'title',
        priority: 'priority',
        status: 'status',
        assignee: 'assigneeId',
        assigneeId: 'assigneeId',
        sprint: 'sprintId',
        sprintId: 'sprintId',
        dueDate: 'dueDate',
      };
      const mappedField = sortFieldMap[field] || 'createdAt';
      sortOption = { [mappedField]: order === 'asc' ? 1 : -1 };
    }

    const issues = await Issue.find(query).sort(sortOption).lean();
    const total = await Issue.countDocuments(query);

    return res.status(200).json({ issues, total });
  } catch (err) {
    next(err);
  }
};

/**
 * createIssue(req, res)
 * requireRole: not Viewer, not RepoAnalyst
 * Logic: validate project/sprint/assignee, check isDeleted/ARCHIVED.
 */
const createIssue = async (req, res, next) => {
  try {
    const {
      title,
      description,
      projectId,
      sprintId,
      assigneeId,
      priority,
      status,
      dueDate
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ error: 'Title and project ID are required' });
    }

    // 1. Check if project exists and is ACTIVE
    const project = await Project.findOne({ projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.status === 'ARCHIVED') {
      return res.status(400).json({ error: 'Cannot create issue in an archived project' });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // 2. Validate assignee
    const normalizedAssigneeId = normalizeNullableField(assigneeId);
    if (normalizedAssigneeId) {
      const assignee = await User.findOne({ userId: normalizedAssigneeId });
      if (!assignee || !assignee.isActive) {
        return res.status(400).json({ error: 'Invalid or inactive assignee' });
      }
    }

    // 3. Validate sprint
    const normalizedSprintId = normalizeNullableField(sprintId);
    if (normalizedSprintId) {
      const sprint = await Sprint.findOne({ sprintId: normalizedSprintId, projectId });
      if (!sprint) {
        return res.status(400).json({ error: 'Invalid sprint for this project' });
      }
    }

    const issue = new Issue({
      projectId,
      sprintId: normalizedSprintId,
      assigneeId: normalizedAssigneeId,
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'Medium',
      status: status || 'ToDo',
      dueDate,
      createdBy: req.user.userId,
    });

    await issue.save();

    // Log Activity
    await ActivityLog.create({
      entityType: 'Issue',
      entityId: issue.issueId,
      action: 'ISSUE_CREATED',
      performedBy: req.user.userId,
      details: { title: issue.title },
    });

    // Option: Emit 'cardCreated' socket event (Phase 2 Requirement 2.4/2.9)
    const io = req.app.get('io');
    if (io) {
      io.of('/board').to(projectId).emit('cardCreated', { issue });
    }

    return res.status(201).json({ issue });
  } catch (err) {
    next(err);
  }
};

/**
 * updateIssue(req, res)
 * requireRole: Admin, ProjectManager, Developer
 * Note: Status is updated via separate updateStatus endpoint.
 */
const updateIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateableFields = ['title', 'description', 'priority', 'status', 'projectId', 'assigneeId', 'dueDate', 'sprintId'];
    
    const updates = {};
    const changedFields = {};
    
    // Check if issue exists
    const issue = await Issue.findOne({ issueId: id, isDeleted: false });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const nextProjectId = req.body.projectId || issue.projectId;

    if (req.body.projectId !== undefined && req.body.projectId !== issue.projectId) {
      const project = await Project.findOne({ projectId: req.body.projectId });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      if (project.status === 'ARCHIVED') {
        return res.status(400).json({ error: 'Cannot move issue into an archived project' });
      }
    }

    if (req.body.priority !== undefined && !VALID_PRIORITIES.includes(req.body.priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    if (req.body.status !== undefined && !VALID_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (req.body.assigneeId !== undefined) {
      const normalizedAssigneeId = normalizeNullableField(req.body.assigneeId);
      if (normalizedAssigneeId) {
        const assignee = await User.findOne({ userId: normalizedAssigneeId });
        if (!assignee || !assignee.isActive) {
          return res.status(400).json({ error: 'Invalid or inactive assignee' });
        }
      }
      req.body.assigneeId = normalizedAssigneeId;
    }

    if (req.body.sprintId !== undefined) {
      const normalizedSprintId = normalizeNullableField(req.body.sprintId);
      if (normalizedSprintId) {
        const sprint = await Sprint.findOne({ sprintId: normalizedSprintId, projectId: nextProjectId });
        if (!sprint) {
          return res.status(400).json({ error: 'Invalid sprint for this project' });
        }
      }
      req.body.sprintId = normalizedSprintId;
    }

    for (const field of updateableFields) {
      if (req.body[field] !== undefined) {
        const nextValue = field === 'description' && typeof req.body[field] === 'string'
          ? req.body[field].trim()
          : req.body[field];

        if (issue[field] !== nextValue) {
          changedFields[field] = { from: issue[field], to: nextValue };
          updates[field] = nextValue;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({ issue });
    }

    const updatedIssue = await Issue.findOneAndUpdate(
      { issueId: id },
      { $set: updates },
      { new: true }
    );

    // Log Activity
    await ActivityLog.create({
      entityType: 'Issue',
      entityId: id,
      action: 'ISSUE_UPDATED',
      performedBy: req.user.userId,
      details: { changedFields },
    });

    return res.status(200).json({ issue: updatedIssue });
  } catch (err) {
    next(err);
  }
};

/**
 * updateStatus(req, res)
 * requireRole: Admin, ProjectManager, Developer
 * Enforcement of strict transition map.
 */
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;

    const VALID_STATUSES = ['ToDo', 'InProgress', 'Review', 'Done'];
    if (!VALID_STATUSES.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const issue = await Issue.findOne({ issueId: id, isDeleted: false });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const currentStatus = issue.status;
    if (currentStatus === newStatus) {
      return res.status(200).json({ issue });
    }

    const allowedTransitions = {
      'ToDo': ['InProgress'],
      'InProgress': ['Review', 'ToDo'],
      'Review': ['Done', 'InProgress'],
      'Done': ['ToDo', 'InProgress', 'Review'],
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      return res.status(400).json({ 
        error: 'Invalid status transition', 
        from: currentStatus, 
        to: newStatus 
      });
    }

    issue.status = newStatus;
    issue.updatedAt = Date.now();
    await issue.save();

    // Log Activity
    await ActivityLog.create({
      entityType: 'Issue',
      entityId: id,
      action: 'STATUS_CHANGED',
      performedBy: req.user.userId,
      details: { from: currentStatus, to: newStatus },
    });

    // Emit Socket.io event 'boardUpdated' (Phase 2 Requirement)
    const io = req.app.get('io');
    if (io) {
      io.of('/board').to(issue.projectId).emit('boardUpdated', {
        issueId: id,
        newStatus,
        updatedIssue: issue,
        performedBy: { userId: req.user.userId, email: req.user.email }
      });
    }

    return res.status(200).json({ issue });
  } catch (err) {
    next(err);
  }
};

/**
 * deleteIssue(req, res)
 * requireRole: Admin, ProjectManager
 * Soft delete: set isDeleted = true.
 */
const deleteIssue = async (req, res, next) => {
  try {
    const { id } = req.params;

    const issue = await Issue.findOneAndUpdate(
      { issueId: id },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Log Activity
    await ActivityLog.create({
      entityType: 'Issue',
      entityId: id,
      action: 'ISSUE_DELETED',
      performedBy: req.user.userId,
    });

    return res.status(200).json({ message: 'Issue deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * getIssue(req, res)
 * Returns single issue with associated activity logs.
 */
const getIssue = async (req, res, next) => {
  try {
    const { id } = req.params;

    const issue = await Issue.findOne({ issueId: id, isDeleted: false }).lean();
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Get activity logs for this issue
    const activityLog = await ActivityLog.find({ entityId: id })
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 })
      .lean();

    return res.status(200).json({ issue, activityLog });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listIssues,
  createIssue,
  updateIssue,
  updateStatus,
  deleteIssue,
  getIssue,
};
