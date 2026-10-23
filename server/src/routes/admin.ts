import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  requireAdmin,
  getAdminOverview,
  getAdminUsers,
  adminResetUserPassword,
  adminUpdateUserRole,
  getAdminProjects,
  getAdminTasks,
} from '../controllers/adminController.js';

const router = Router();

// Protect all admin endpoints with JWT authentication and admin role enforcement
router.use(authenticate, requireAdmin);

router.get('/overview', getAdminOverview);
router.get('/users', getAdminUsers);
router.post('/users/:userId/password', adminResetUserPassword);
router.patch('/users/:userId/role', adminUpdateUserRole);
router.get('/projects', getAdminProjects);
router.get('/tasks', getAdminTasks);

export default router;
