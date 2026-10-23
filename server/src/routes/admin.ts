import { Router } from 'express';
import {
  getAdminOverview,
  getAdminUsers,
  adminResetUserPassword,
  adminUpdateUserRole,
  getAdminProjects,
  getAdminTasks,
} from '../controllers/adminController.js';

const router = Router();

// مسارات لوحة الإدارة مفتوحة ومتاحة لأي زائر مباشرة وفق رغبة المطور
router.get('/overview', getAdminOverview);
router.get('/users', getAdminUsers);
router.post('/users/:userId/password', adminResetUserPassword);
router.patch('/users/:userId/role', adminUpdateUserRole);
router.get('/projects', getAdminProjects);
router.get('/tasks', getAdminTasks);

export default router;
