import { Router } from 'express';
import {
  register,
  login,
  getMe,
  listAllUsers,
  updateProfile,
  changePassword,
  deleteAccount,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import {
  registrationRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  resetRegistrationRateLimits,
} from '../middlewares/security.js';
import { getFrontendUrl } from '../services/emailService.js';

const router = Router();

router.post('/register', registrationRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, listAllUsers);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.delete('/account', authenticate, deleteAccount);

// Enterprise Password Reset Endpoints
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);
router.get('/forgot-password', (req, res) => {
  const host = req.get('host') || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const frontendBase = isLocal ? 'http://localhost:3000' : getFrontendUrl();
  const targetUrl = `${frontendBase}/forgot-password`;

  if (req.accepts('html')) {
    return res.redirect(302, targetUrl);
  }
  return res.json({
    status: 'active',
    endpoint: '/api/auth/forgot-password',
    method: 'POST',
    description: 'Enterprise Password Reset Dispatcher. Send a POST request with { "email": "user@example.com" } to dispatch an official reset link.',
    webPage: targetUrl,
  });
});
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', passwordResetRateLimiter, resetPassword);
router.get('/reset-password', (req, res) => {
  const token = req.query.token;
  const host = req.get('host') || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const frontendBase = isLocal ? 'http://localhost:3000' : getFrontendUrl();
  const targetUrl = token
    ? `${frontendBase}/reset-password?token=${encodeURIComponent(String(token))}`
    : `${frontendBase}/forgot-password`;
  return res.redirect(302, targetUrl);
});

if (process.env.NODE_ENV !== 'production') {
  router.post('/reset-limiter', (_req, res) => {
    resetRegistrationRateLimits();
    res.json({ ok: true, message: 'Registration rate limiters reset.' });
  });
}

export default router;
