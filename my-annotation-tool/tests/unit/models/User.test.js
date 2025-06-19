import mongoose from 'mongoose';
import User from '../../../backend/models/User.js';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

mongoose.Model.prototype.save = jest.fn();

describe('User Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create a new user with valid fields', () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const user = new User(userData);
    
    expect(user).toHaveProperty('username', 'testuser');
    expect(user).toHaveProperty('email', 'test@example.com');
    expect(user).toHaveProperty('password', 'password123');
    expect(user).toHaveProperty('isAdmin', false);
  });

  test('should fail validation if required fields are missing', async () => {
    const user = new User({});
    
    let validationError;
    try {
      await user.validate();
    } catch (error) {
      validationError = error;
    }
    
    expect(validationError).toBeDefined();
    expect(validationError.errors.username).toBeDefined();
    expect(validationError.errors.email).toBeDefined();
    expect(validationError.errors.password).toBeDefined();
  });

  test('should have timestamps', () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  });

  test('should set resetToken and resetTokenExpiry', () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      resetToken: 'token123',
      resetTokenExpiry: new Date()
    });
    
    expect(user.resetToken).toBe('token123');
    expect(user.resetTokenExpiry).toBeInstanceOf(Date);
  });
});