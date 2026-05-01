const express = require('express');
const { getProjects, createProject } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getProjects)
  .post(protect, authorize('admin'), createProject);

module.exports = router;
