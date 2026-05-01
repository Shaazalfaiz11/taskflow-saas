const { Task, Project, User, ActivityLog } = require('../models');
const { Op } = require('sequelize');

// Helper to log activity
const logActivity = async (userId, action, entityType, entityId, details) => {
  try {
    await ActivityLog.create({ userId, action, entityType, entityId, details });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin only)
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, assignedTo, projectId, dueDate, priority } = req.body;

    const task = await Task.create({
      title,
      description: description || '',
      status: status || 'pending',
      priority: priority || 'medium',
      assignedTo,
      projectId,
      dueDate,
    });

    await logActivity(req.user.id, 'created', 'task', task.id, `Created task: "${title}"`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { status, sort, overdue, projectId, priority, search } = req.query;

    let where = {};
    if (req.user.role === 'member') {
      where.assignedTo = req.user.id;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (status && ['pending', 'in-progress', 'completed'].includes(status)) {
      where.status = status;
    }

    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      where.priority = priority;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (overdue === 'true') {
      where.dueDate = { [Op.lt]: new Date() };
      where.status = { [Op.ne]: 'completed' };
    }

    let order = [['createdAt', 'DESC']];
    if (sort === 'oldest') order = [['createdAt', 'ASC']];
    if (sort === 'title') order = [['title', 'ASC']];
    if (sort === 'status') order = [['status', 'ASC']];
    if (sort === 'dueDate') order = [['dueDate', 'ASC']];
    if (sort === 'priority') order = [['priority', 'ASC']];

    const tasks = await Task.findAll({ 
      where, 
      order,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'name'] }
      ]
    });

    res.json({
      success: true,
      data: { tasks, count: tasks.length },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res, next) => {
  try {
    let where = { id: req.params.id };
    if (req.user.role === 'member') {
      where.assignedTo = req.user.id;
    }

    const task = await Task.findOne({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'name'] }
      ]
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    let where = { id: req.params.id };
    if (req.user.role === 'member') {
      where.assignedTo = req.user.id;
    }

    const task = await Task.findOne({ where });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { title, description, status, assignedTo, dueDate, priority } = req.body;
    const changes = [];

    if (req.user.role === 'admin') {
      if (title !== undefined && title !== task.title) { task.title = title; changes.push('title'); }
      if (description !== undefined) { task.description = description; changes.push('description'); }
      if (assignedTo !== undefined) { task.assignedTo = assignedTo; changes.push('assignee'); }
      if (dueDate !== undefined) { task.dueDate = dueDate; changes.push('due date'); }
      if (priority !== undefined && priority !== task.priority) { task.priority = priority; changes.push('priority'); }
    }
    
    if (status !== undefined && status !== task.status) {
      const oldStatus = task.status;
      task.status = status;
      changes.push(`status: ${oldStatus} → ${status}`);
    }

    await task.save();

    if (changes.length > 0) {
      await logActivity(req.user.id, 'updated', 'task', task.id, `Updated ${changes.join(', ')} on "${task.title}"`);
    }

    res.json({ success: true, message: 'Task updated successfully', data: { task } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id } });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const taskTitle = task.title;
    await task.destroy();

    await logActivity(req.user.id, 'deleted', 'task', req.params.id, `Deleted task: "${taskTitle}"`);

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask };
