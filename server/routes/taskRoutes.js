const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');
const { validateTask, validateTaskUpdate } = require('../middleware/validate');

// All task routes are protected
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(authorize('admin'), validateTask, createTask);

router.route('/:id')
  .get(getTask)
  .put(validateTaskUpdate, updateTask)
  .delete(authorize('admin'), deleteTask);

module.exports = router;
