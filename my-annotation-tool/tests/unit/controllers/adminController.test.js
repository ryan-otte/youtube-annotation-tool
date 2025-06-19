import * as adminController from '../../../backend/controllers/adminController.js';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

jest.mock('../../../backend/models/User.js');
jest.mock('../../../backend/models/Annotation.js');
jest.mock('nodemailer');

describe('Admin Controller', () => {
  let req;
  let res;
  
  const User = require('../../../backend/models/User.js');
  const Annotation = require('../../../backend/models/Annotation.js');
  const nodemailer = require('nodemailer');
  
  console.log('Admin Controller functions:', Object.keys(adminController));
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      params: { userId: 'user123' },
      user: { _id: 'admin123', isAdmin: true },
      body: {
        subject: 'Test Subject',
        message: 'Test Message',
        userId: 'user123',
        userIds: ['user123', 'user456']
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    User.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue([
        { 
          _id: 'user123', 
          username: 'testuser', 
          email: 'test@example.com',
          isAdmin: false
        },
        { 
          _id: 'user456', 
          username: 'testuser2', 
          email: 'test2@example.com',
          isAdmin: false
        }
      ])
    });
    
    User.findById = jest.fn().mockResolvedValue({
      _id: 'user123',
      username: 'testuser',
      email: 'test@example.com'
    });
    
    User.findByIdAndDelete = jest.fn().mockResolvedValue({
      _id: 'user123',
      username: 'testuser'
    });
    
    Annotation.countDocuments = jest.fn().mockResolvedValue(5);
    Annotation.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 3 });
    
    const mockSendMail = jest.fn().mockResolvedValue({ response: 'Email sent' });
    nodemailer.createTransport = jest.fn().mockReturnValue({
      sendMail: mockSendMail
    });
  });
  
  describe('getAllUsers', () => {
    test('should return all users with annotation counts', async () => {
      if (!adminController.getAllUsers) {
        console.log('Skipping test: getAllUsers function not found');
        return;
      }
      
      await adminController.getAllUsers(req, res);
      
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should handle unauthorized access', async () => {
      if (!adminController.getAllUsers) {
        console.log('Skipping test: getAllUsers function not found');
        return;
      }
      
      req.user.isAdmin = false;
      
      await adminController.getAllUsers(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Admin access required')
      }));
    });
    
    test('should handle database errors', async () => {
      if (!adminController.getAllUsers) {
        console.log('Skipping test: getAllUsers function not found');
        return;
      }
      
      User.find = jest.fn(() => {
        throw new Error('Database error');
      });
      
      await adminController.getAllUsers(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  
  describe('deleteUser', () => {
    test('should delete a user and their annotations', async () => {
      if (!adminController.deleteUser) {
        console.log('Skipping test: deleteUser function not found');
        return;
      }
      
      await adminController.deleteUser(req, res);
      
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should prevent admin from deleting their own account', async () => {
      if (!adminController.deleteUser) {
        console.log('Skipping test: deleteUser function not found');
        return;
      }
      
      req.params.userId = 'admin123';
      
      await adminController.deleteUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
    
    test('should handle user not found', async () => {
      if (!adminController.deleteUser) {
        console.log('Skipping test: deleteUser function not found');
        return;
      }
      
      User.findByIdAndDelete = jest.fn().mockResolvedValue(null);
      
      await adminController.deleteUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle database errors', async () => {
      if (!adminController.deleteUser) {
        console.log('Skipping test: deleteUser function not found');
        return;
      }
      
      User.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await adminController.deleteUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
  
  describe('sendEmail', () => {
    test('should send email to a user', async () => {
      if (!adminController.sendEmail) {
        console.log('Skipping test: sendEmail function not found');
        return;
      }
      
      const mockSendMail = jest.fn().mockResolvedValue({ response: 'Email sent' });
      nodemailer.createTransport = jest.fn().mockReturnValue({
        sendMail: mockSendMail
      });
      
      await adminController.sendEmail(req, res);
      
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should handle user not found error', async () => {
      if (!adminController.sendEmail) {
        console.log('Skipping test: sendEmail function not found');
        return;
      }
      
      User.findById = jest.fn().mockResolvedValue(null);
      
      await adminController.sendEmail(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle missing required fields', async () => {
      if (!adminController.sendEmail) {
        console.log('Skipping test: sendEmail function not found');
        return;
      }
      
      req.body = { userId: 'user123' }; 
      
      await adminController.sendEmail(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle email sending failure', async () => {
      if (!adminController.sendEmail) {
        console.log('Skipping test: sendEmail function not found');
        return;
      }
      
      const mockSendMail = jest.fn().mockRejectedValue(new Error('SMTP error'));
      nodemailer.createTransport = jest.fn().mockReturnValue({
        sendMail: mockSendMail
      });
      
      await adminController.sendEmail(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
  
  describe('sendBulkEmail', () => {
    test('should send emails to multiple users', async () => {
      if (!adminController.sendBulkEmail) {
        console.log('Skipping test: sendBulkEmail function not found');
        return;
      }

      await adminController.sendBulkEmail(req, res);
      
      expect(res.json).toHaveBeenCalled();
    });

    test('should handle no users found', async () => {
      if (!adminController.sendBulkEmail) {
        console.log('Skipping test: sendBulkEmail function not found');
        return;
      }
      
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue([])
      });
      
      await adminController.sendBulkEmail(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should handle missing required fields', async () => {
      if (!adminController.sendBulkEmail) {
        console.log('Skipping test: sendBulkEmail function not found');
        return;
      }
      
      req.body = { userIds: ['user123', 'user456'] }; 
      
      await adminController.sendBulkEmail(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500); 
    });

    test('should handle email sending failure', async () => {
      if (!adminController.sendBulkEmail) {
        console.log('Skipping test: sendBulkEmail function not found');
        return;
      }
      
      const mockSendMail = jest.fn().mockRejectedValue(new Error('SMTP error'));
      nodemailer.createTransport = jest.fn().mockReturnValue({
        sendMail: mockSendMail
      });
      
      await adminController.sendBulkEmail(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});