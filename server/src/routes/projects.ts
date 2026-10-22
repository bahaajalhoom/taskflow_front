import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  listProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
  getProjectMessages,
  createProjectMessage,
  getProjectMeeting,
  updateProjectMeeting,
} from '../controllers/projectsController.js';

const router = Router();

router.use(authenticate);

router.get('/', listProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

router.post('/:id/members', addMember);
router.patch('/:id/members/:memberId', updateMemberRole);
router.delete('/:id/members/:memberId', removeMember);

// Team Chat & Live Conference
router.get('/:id/messages', getProjectMessages);
router.post('/:id/messages', createProjectMessage);
router.get('/:id/meetings', getProjectMeeting);
router.patch('/:id/meetings', updateProjectMeeting);

export default router;
