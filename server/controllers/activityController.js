const { ActivityLog, User } = require('../models');

// @desc    Get activity logs
// @route   GET /api/activity
// @access  Private
const getActivityLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const logs = await ActivityLog.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'role'] }
      ]
    });

    const total = await ActivityLog.count();

    res.json({
      success: true,
      data: { logs, total, limit, offset },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActivityLogs };
