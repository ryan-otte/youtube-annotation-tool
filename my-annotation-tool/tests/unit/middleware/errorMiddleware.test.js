import { errorHandler, notFound } from '../../../backend/middleware/errorMiddleware.js';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
describe('Error Middleware', () => {
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    req = {
      originalUrl: '/test/url'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });
  
  describe('notFound', () => {
    test('should create a 404 error and pass it to next', () => {
      notFound(req, res, next);
      
      expect(next).toHaveBeenCalled();
      
      // Get the error that was passed to next
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Not Found - ${req.originalUrl}`);
      expect(error.statusCode).toBe(404);
    });
  });
  
  describe('errorHandler', () => {
    test('should handle error with statusCode', () => {
      const error = new Error('Test error');
      error.statusCode = 400;
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Test error',
        stack: expect.any(String)
      });
    });
    
    test('should default to 500 status code if not specified', () => {
      const error = new Error('Server error');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        stack: expect.any(String)
      });
    });
    
    test('should hide stack trace in production environment', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Production error');
      
      errorHandler(error, req, res, next);
      
      expect(res.json).toHaveBeenCalledWith({
        message: 'Production error',
        stack: null
      });
      
      
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
});