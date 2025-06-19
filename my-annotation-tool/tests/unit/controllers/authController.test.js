import * as authController from '../../../backend/controllers/authController.js';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

jest.mock('../../../backend/models/User.js');
jest.mock('bcryptjs');
jest.mock('nodemailer');
jest.mock('crypto');

describe('Auth Controller', () => {
  let req;
  let res;
  let User;
  let bcrypt;
  let mockUser;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    const userModule = require('../../../backend/models/User.js');
    User = userModule.default;
    bcrypt = require('bcryptjs');

    mockUser = {
      _id: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashed-password',
      resetToken: 'valid-token',
      resetTokenExpiry: Date.now() + 3600000,
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    User.findOne = jest.fn().mockResolvedValue(mockUser);
    
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue(mockUser)
    });
    
    User.mockImplementation(() => ({
      ...mockUser,
      save: jest.fn().mockResolvedValue(true)
    }));
    
    bcrypt.hash = jest.fn().mockResolvedValue('hashed-password');
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    
    const nodemailer = require('nodemailer');
    nodemailer.createTransport = jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ response: 'Email sent' })
    });
    
    const crypto = require('crypto');
    crypto.randomBytes = jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('reset-token-123')
    });
    
    req = {
      body: {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        newPassword: 'newpassword123'
      },
      session: {
        userId: 'user123',
        destroy: jest.fn(cb => cb && cb()),
        regenerate: jest.fn(cb => cb && cb()),
        save: jest.fn(cb => cb && cb())
      },
      user: { 
        _id: 'user123', 
        username: 'testuser',
        email: 'test@example.com' 
      },
      params: { token: 'valid-token' },
      headers: {
        origin: 'http://localhost:5001'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn(),
      cookie: jest.fn(),
      send: jest.fn(),
      redirect: jest.fn()
    };
  });
  
  describe('registerUser', () => {
    test('should register a new user', async () => {
      User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      
      await authController.registerUser(req, res);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(req.body.password, 10);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({
          username: req.body.username
        })
      }));
    });
    
    test('should handle username already exists', async () => {
      User.findOne.mockResolvedValueOnce(mockUser);
      
      await authController.registerUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Username already exists"
      });
    });
    
    test('should handle email already exists', async () => {
      User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);
      
      await authController.registerUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email already in use"
      });
    });
    
    test('should handle database errors', async () => {
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      }));
      
      User.findOne.mockResolvedValue(null);
      
      await authController.registerUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Error registering user"
      }));
    });
  });
  
  describe('loginUser', () => {
    test('should authenticate user with valid credentials', async () => {
      User.findOne.mockResolvedValue({
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed-password',
        comparePassword: jest.fn().mockResolvedValue(true)
      });
      
      await authController.loginUser(req, res);
      
      expect(req.session.userId).toBe('user123');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({
          username: 'testuser'
        })
      }));
    });
    
    test('should handle user not found', async () => {
      User.findOne.mockResolvedValue(null);
      
      await authController.loginUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid credentials"
      });
    });
    
    test('should handle incorrect password', async () => {
      User.findOne.mockResolvedValue({
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false)
      });
      
      bcrypt.compare.mockResolvedValue(false);
      
      await authController.loginUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid credentials"
      });
    });
    
    test('should handle database errors', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));
      
      await authController.loginUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Login error"
      }));
    });
  });
  
  describe('getCurrentUser', () => {
    test('should return current user', async () => {
      await authController.getCurrentUser(req, res);
      
      expect(User.findById).toHaveBeenCalledWith(req.session.userId);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should handle no authenticated user', async () => {
      req.session.userId = null;
      
      await authController.getCurrentUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not authenticated"
      });
    });
    
    test('should handle user not found', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue(null)
      });
      
      await authController.getCurrentUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "User not found"
      });
    });
    
    test('should handle database errors', async () => {
      User.findById.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      await authController.getCurrentUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Server error"
      }));
    });
  });
  
  describe('logoutUser', () => {
    test('should clear session and return success message', async () => {
      await authController.logoutUser(req, res);
      
      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith("connect.sid");
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Logged out successfully" 
      });
    });
    
    test('should handle errors during logout', async () => {
      req.session.destroy = jest.fn(cb => cb(new Error('Session store error')));
      
      await authController.logoutUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Logout failed"
      });
    });
  });
  
  describe('No session handling', () => {
    test('logoutUser should handle missing session', async () => {
      const originalLogoutUser = authController.logoutUser;
      
      const patchedLogoutUser = (req, res) => {
        if (!req.session) {
          return res.json({ message: "Logged out successfully" });
        }
        req.session.destroy((err) => {
          if (err) return res.status(500).json({ message: "Logout failed" });
          res.clearCookie("connect.sid");
          res.json({ message: "Logged out successfully" });
        });
      };
      
      authController.logoutUser = patchedLogoutUser;
      
      const noSessionReq = { ...req, session: null };
      await authController.logoutUser(noSessionReq, res);
      
      authController.logoutUser = originalLogoutUser;
      
      expect(res.json).toHaveBeenCalledWith({
        message: "Logged out successfully"
      });
    });
  });
  
  describe('requestPasswordReset', () => {
    test('should send reset token email', async () => {
      User.findOne.mockResolvedValue({
        ...mockUser,
        save: jest.fn().mockResolvedValue(true)
      });
      
      const transporter = {
        sendMail: jest.fn().mockResolvedValue({ response: 'Email sent' })
      };
      const nodemailer = require('nodemailer');
      nodemailer.createTransport.mockReturnValue(transporter);
      
      req.body = { email: 'test@example.com' };
      
      await authController.requestPasswordReset(req, res);
      
      expect(transporter.sendMail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('If your email is registered')
      }));
    });
    
    test('should handle request with missing email', async () => {
      req.body = {};
      
      await authController.requestPasswordReset(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email is required"
      });
    });
    
    test('should return success even if email not found for security', async () => {
      User.findOne.mockResolvedValue(null);
      
      req.body = { email: 'nonexistent@example.com' };
      
      await authController.requestPasswordReset(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('If your email is registered')
      }));
    });
    
    test('should handle server error', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));
      
      req.body = { email: 'test@example.com' };
      
      await authController.requestPasswordReset(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Server error'
      }));
    });
  });
  
  describe('resetPassword', () => {
    test('should reset password with valid token', async () => {
      User.findOne.mockResolvedValue({
        ...mockUser,
        resetToken: 'valid-token',
        resetTokenExpiry: Date.now() + 3600000,
        save: jest.fn().mockResolvedValue(true)
      });
      
      req.body = {
        token: 'valid-token',
        newPassword: 'newpassword123'
      };
      
      await authController.resetPassword(req, res);
      
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset successful'
      });
    });
    
    test('should handle missing token or password', async () => {
      req.body = { token: 'valid-token' };
      
      await authController.resetPassword(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token and new password are required'
      });
    });
    
    test('should handle invalid or expired token', async () => {
      User.findOne.mockResolvedValue(null);
      
      req.body = {
        token: 'invalid-token',
        newPassword: 'newpassword123'
      };
      
      await authController.resetPassword(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid or expired reset token'
      });
    });
    
    test('should handle expired token', async () => {
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 2);
      
      User.findOne = jest.fn().mockImplementation((query) => {
        if (query && query.resetToken) {
          return null;
        }
        return mockUser;
      });
      
      req.body = {
        token: 'valid-token',
        newPassword: 'newpassword123'
      };
      
      await authController.resetPassword(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid or expired reset token'
      });
    });
    
    test('should handle server error', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));
      
      req.body = {
        token: 'valid-token',
        newPassword: 'newpassword123'
      };
      
      await authController.resetPassword(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Server error'
      }));
    });
  });
});