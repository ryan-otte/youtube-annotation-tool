import { isAuthenticated, isAdmin } from '../../../backend/middleware/authMiddleware.js';
import User from '../../../backend/models/User.js';
import { mockUser, mockAdmin } from '../../mocks/mockData.js';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

jest.mock('../../../backend/models/User.js');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    req = {
      session: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });
  
  describe('isAuthenticated', () => {
    test('should return 401 if no userId in session', async () => {
      req.session.userId = null;
      
      await isAuthenticated(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Not authenticated"
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should call next if user is authenticated', async () => {
      req.session.userId = mockUser._id;
      
      User.findById = jest.fn().mockResolvedValue(mockUser);
      
      await isAuthenticated(req, res, next);
      
      expect(req.user).toBe(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('should return 401 if user not found', async () => {
      req.session.userId = 'nonexistentid';
      
      User.findById = jest.fn().mockResolvedValue(null);
      
      await isAuthenticated(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "User not found"
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should handle database errors', async () => {
      req.session.userId = mockUser._id;
      
      const error = new Error('Database error');
      User.findById = jest.fn().mockRejectedValue(error);
      
      await isAuthenticated(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Server error"
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('isAdmin', () => {
    test('should call next if user is admin', async () => {
      req.session.userId = mockAdmin._id;
      
      User.findById = jest.fn().mockResolvedValue(mockAdmin);
      
      await isAdmin(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('should return 401 if no userId in session', async () => {
      req.session.userId = null;
      
      await isAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Not authenticated"
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should return 403 if user is not admin', async () => {
      req.session.userId = mockUser._id;
      
      User.findById = jest.fn().mockResolvedValue(mockUser);
      
      await isAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Unauthorized: Admin access required"
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should return 401 if user not found', async () => {
      req.session.userId = 'nonexistentid';
      
      User.findById = jest.fn().mockResolvedValue(null);
      
      await isAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "User not found"
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should handle database errors', async () => {
      req.session.userId = mockAdmin._id;
      
      const error = new Error('Database error');
      User.findById = jest.fn().mockRejectedValue(error);
      
      await isAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Server error"
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });
});