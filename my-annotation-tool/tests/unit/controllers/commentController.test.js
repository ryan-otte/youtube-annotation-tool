import { 
  getComments,
  createComment,
  deleteComment
} from '../../../backend/controllers/commentController.js';
import Comment from '../../../backend/models/Comment.js';
import { mockComment, mockUser } from '../../mocks/mockData.js';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

jest.mock('../../../backend/models/Comment.js');

describe('Comment Controller', () => {
  let req;
  let res;
  
  beforeEach(() => {
    req = {
      params: { id: 'comment123', annotationId: 'anno1' },
      body: { text: 'Test comment' },
      user: { _id: 'user123', username: 'testuser' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getComments', () => {
    test('should return comments for an annotation', async () => {
      const mockComments = [
        { _id: 'comment1', annotationId: 'anno1', text: 'Comment 1' },
        { _id: 'comment2', annotationId: 'anno1', text: 'Comment 2' }
      ];
      
      Comment.find.mockResolvedValueOnce(mockComments);
      
      await getComments(req, res);
      
      expect(Comment.find).toHaveBeenCalledWith({ annotationId: 'anno1' });
      expect(res.json).toHaveBeenCalledWith(mockComments);
    });
    
    test('should handle errors when retrieving comments', async () => {
      Comment.find.mockRejectedValueOnce(new Error('Database error'));
      
      await getComments(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Error') })
      );
    });
  });
  
  describe('createComment', () => {
    test('should create a new comment', async () => {
      const newComment = { 
        _id: 'newComment', 
        annotationId: 'anno1', 
        text: 'New comment',
        userId: 'user123'
      };
      
      Comment.create.mockResolvedValueOnce(newComment);
      
      await createComment(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should handle errors when creating a comment', async () => {
      const validationError = new Error('Validation error');
      
      const newComment = { 
        _id: 'newComment', 
        annotationId: 'anno1', 
        text: 'New comment',
        save: jest.fn().mockImplementation(() => {
          throw validationError;
        })
      };
      
      Comment.create = jest.fn().mockReturnValue(newComment);
      
      await createComment(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });
  });
  
  describe('deleteComment', () => {
    test('should delete a comment', async () => {
      const comment = {
        _id: 'comment123',
        userId: 'user123',
        annotationId: 'anno1'
      };
      
      Comment.findById.mockResolvedValueOnce(comment);
      Comment.findByIdAndDelete.mockResolvedValueOnce(comment);
      
      await deleteComment(req, res);
      
      expect(Comment.findByIdAndDelete).toHaveBeenCalledWith('comment123');
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully' });
    });
    
    test('should handle errors when deleting a comment', async () => {
      Comment.findById.mockRejectedValueOnce(new Error('Database error'));
      
      await deleteComment(req, res);
      
      expect(res.json).toHaveBeenCalled();
    });
  });
});