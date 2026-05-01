const { Project, Task, User } = require('../models');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    let projects;
    
    if (req.user.role === 'admin') {
      projects = await Project.findAll({
        include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }]
      });
    } else {
      // Member sees projects where they have tasks assigned
      const userTasks = await Task.findAll({
        where: { assignedTo: req.user.id },
        attributes: ['projectId'],
        group: ['projectId']
      });
      const projectIds = userTasks.map(t => t.projectId);
      
      projects = await Project.findAll({
        where: { id: projectIds },
        include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }]
      });
    }

    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private (Admin only)
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    const project = await Project.create({
      name,
      description,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, createProject };
