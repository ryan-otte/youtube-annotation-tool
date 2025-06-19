import mongoose from 'mongoose';
import Comment from '../../../backend/models/Comment.js';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

mongoose.Model.prototype.save = jest.fn();

describe('Comment Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create a new comment with valid fields', () => {
    const commentData = {
      annotationId: new mongoose.Types.ObjectId(),
      text: 'This is a test comment',
      createdAt: new Date()
    };
    
    const comment = new Comment(commentData);
    
    expect(comment).toHaveProperty('annotationId', commentData.annotationId);
    expect(comment).toHaveProperty('text', 'This is a test comment');
    expect(comment).toHaveProperty('createdAt');
  });

  test('should fail validation if required fields are missing', async () => {
    const comment = new Comment({});
    
    let validationError;
    try {
      await comment.validate();
    } catch (error) {
      validationError = error;
    }
    
    expect(validationError).toBeDefined();
    expect(validationError.errors.annotationId).toBeDefined();
    expect(validationError.errors.text).toBeDefined();
  });

  test('should use current date as default for createdAt', () => {
    const now = new Date();
    const comment = new Comment({
      annotationId: new mongoose.Types.ObjectId(),
      text: 'Test comment'
    });
    
    const createdAt = comment.createdAt;
    const timeDiff = Math.abs(createdAt - now);
    
    expect(timeDiff).toBeLessThan(10000);
  });

  test('should handle references correctly', () => {
    const annotationId = new mongoose.Types.ObjectId();
    const comment = new Comment({
      annotationId,
      text: 'Test comment'
    });
    
    expect(comment.annotationId).toEqual(annotationId);
    expect(Comment.schema.paths.annotationId.instance).toBe('ObjectId');
    expect(Comment.schema.paths.annotationId.options.ref).toBe('Annotation');
  });
});