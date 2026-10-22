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
  updateProjectMessage,
  deleteProjectMessage,
  markMessagesAsRead,
  getProjectMeeting,
  updateProjectMeeting,
  joinMeeting,
  leaveMeeting,
  meetingHeartbeat,
  getMeetingParticipants,
  sendMeetingSignal,
  getMeetingSignals,
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

// Team Chat Lifecycle
router.get('/:id/messages', getProjectMessages);
router.post('/:id/messages', createProjectMessage);
router.patch('/:id/messages/:messageId', updateProjectMessage);
router.delete('/:id/messages/:messageId', deleteProjectMessage);
router.post('/:id/messages/read', markMessagesAsRead);

// Custom Native Meeting & WebRTC Signaling Engine
router.get('/:id/meetings', getProjectMeeting);
router.patch('/:id/meetings', updateProjectMeeting);
router.post('/:id/meeting/join', joinMeeting);
router.post('/:id/meeting/leave', leaveMeeting);
router.post('/:id/meeting/heartbeat', meetingHeartbeat);
router.get('/:id/meeting/participants', getMeetingParticipants);
router.post('/:id/meeting/signal', sendMeetingSignal);
router.get('/:id/meeting/signals', getMeetingSignals);

export default router;
