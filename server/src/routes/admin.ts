import { Router } from 'express';
import {
  getAdminOverview,
  getAdminUsers,
  adminResetUserPassword,
  adminUpdateUserRole,
  getAdminProjects,
  getAdminTasks,
} from '../controllers/adminController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Enforce strict authentication barrier across all administrative API routes
router.use(authenticate);

router.get('/overview', getAdminOverview);
router.get('/users', getAdminUsers);
router.post('/users/:userId/password', adminResetUserPassword);
router.patch('/users/:userId/role', adminUpdateUserRole);
router.get('/projects', getAdminProjects);
router.get('/tasks', getAdminTasks);

export default router;
