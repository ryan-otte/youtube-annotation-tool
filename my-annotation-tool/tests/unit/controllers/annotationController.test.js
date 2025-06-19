import { 
  getAnnotations, 
  saveAnnotations, 
  deleteAnnotation,
  getUserAnnotations,
  getUsersWithAnnotationsForVideo
} from '../../../backend/controllers/annotationController.js';
import Annotation from '../../../backend/models/Annotation.js';

jest.mock('../../../backend/models/Annotation.js');

describe('Annotation Controller', () => {
  let req, res;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      params: {},
      query: {},
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    console.log('Testing annotationController functions');
  });

  describe('getAnnotations', () => {
    test('should return annotation when found', async () => {
      req.params = { videoId: 'video123' };
      req.query = { userId: 'user123' };
      
      const mockAnnotation = {
        _id: 'anno123',
        videoId: 'video123',
        userId: 'user123',
        annotations: [{ id: '1', type: 'rectangle', coordinates: {} }],
        comments: [{ id: '1', text: 'Comment' }],
        toObject: jest.fn().mockReturnValue({
          _id: 'anno123',
          videoId: 'video123',
          userId: 'user123',
          annotations: [{ id: '1', type: 'rectangle', coordinates: {} }],
          comments: [{ id: '1', text: 'Comment' }]
        })
      };
      
      Annotation.findOne = jest.fn().mockResolvedValue(mockAnnotation);
      
      await getAnnotations(req, res);
      
      expect(Annotation.findOne).toHaveBeenCalledWith({
        videoId: 'video123',
        userId: 'user123'
      });
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should return empty arrays when no annotations found', async () => {
      req.params = { videoId: 'video123' };
      req.query = { userId: 'user123' };
      
      Annotation.findOne = jest.fn().mockResolvedValue(null);
      
      await getAnnotations(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        annotations: [],
        comments: {}
      });
    });
    
    test('should handle errors', async () => {
      req.params = { videoId: 'video123' };
      
      Annotation.findOne = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await getAnnotations(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving annotations',
        error: expect.any(Error)
      });
    });
  });

  describe('saveAnnotations', () => {
    test('should update existing annotations', async () => {
      req.body = {
        videoId: 'video123',
        userId: 'user123',
        annotations: [{ id: '1', type: 'rectangle', coordinates: {} }]
      };
      
      const mockAnnotation = {
        _id: 'anno123',
        videoId: 'video123',
        userId: 'user123',
        annotations: [],
        save: jest.fn().mockResolvedValue({ _id: 'anno123' })
      };
      
      Annotation.findOne = jest.fn().mockResolvedValue(mockAnnotation);
      
      await saveAnnotations(req, res);
      
      expect(Annotation.findOne).toHaveBeenCalledWith({
        videoId: 'video123',
        userId: 'user123'
      });
      expect(mockAnnotation.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('saved successfully')
      }));
    });
    
    test('should create new annotations when none exist', async () => {
      req.body = {
        videoId: 'video123',
        userId: 'user123',
        annotations: [{ id: '1', type: 'rectangle', coordinates: {} }]
      };
      
      Annotation.findOne = jest.fn().mockResolvedValue(null);
      
      const mockCreatedAnnotation = {
        _id: 'newAnno123',
        videoId: 'video123',
        userId: 'user123'
      };
      Annotation.create = jest.fn().mockResolvedValue(mockCreatedAnnotation);
      
      await saveAnnotations(req, res);
      
      expect(Annotation.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('saved successfully')
      }));
    });
    
    test('should handle missing videoId', async () => {
      req.body = {
        userId: 'user123',
        annotations: [{ id: '1', type: 'rectangle' }]
      };
      
      await saveAnnotations(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing videoId'
      });
    });
    
    test('should handle missing userId', async () => {
      req.body = {
        videoId: 'video123',
        annotations: [{ id: '1', type: 'rectangle' }]
      };
      
      await saveAnnotations(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing userId'
      });
    });
    
    test('should handle errors', async () => {
      req.body = {
        videoId: 'video123',
        userId: 'user123',
        annotations: [{ id: '1', type: 'rectangle' }]
      };
      
      Annotation.findOne = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await saveAnnotations(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error saving annotations',
        error: expect.any(Error)
      });
    });
  });

  describe('deleteAnnotation', () => {
    test('should delete an annotation', async () => {
      req.params = { id: 'anno123' };
      
      Annotation.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'anno123' });
      
      await deleteAnnotation(req, res);
      
      expect(Annotation.findByIdAndDelete).toHaveBeenCalledWith(req.params.id);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Annotation deleted successfully'
      });
    });
    
    test('should handle errors', async () => {
      req.params = { id: 'anno123' };
      
      Annotation.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await deleteAnnotation(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error deleting annotation',
        error: expect.any(Error)
      });
    });
  });

  describe('getUserAnnotations', () => {
    test('should get user annotations', async () => {
      req.params = { userId: 'user123' };
      
      const mockAnnotations = [
        { _id: 'anno123', videoId: 'video123', userId: 'user123' },
        { _id: 'anno456', videoId: 'video456', userId: 'user123' }
      ];
      
      Annotation.find = jest.fn().mockResolvedValue(mockAnnotations);
      
      await getUserAnnotations(req, res);
      
      expect(Annotation.find).toHaveBeenCalledWith({ userId: req.params.userId });
      expect(res.json).toHaveBeenCalledWith(mockAnnotations);
    });
    
    test('should handle errors', async () => {
      req.params = { userId: 'user123' };
      
      Annotation.find = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await getUserAnnotations(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving user annotations',
        error: expect.any(Error)
      });
    });
  });

  describe('getUsersWithAnnotationsForVideo', () => {
    test('should return users with annotations for a video', async () => {
      req.params = { videoId: 'video123' };
      
      const distinctUsers = ['user1', 'user2'];
      Annotation.distinct = jest.fn().mockResolvedValue(distinctUsers);
      
      const mockAnnotationDocs = [
        { 
          userId: 'user1', 
          videoId: 'video123', 
          annotations: [{ id: 'a1' }],
          toObject: jest.fn().mockReturnValue({
            userId: 'user1', 
            videoId: 'video123', 
            annotations: [{ id: 'a1' }]
          })
        },
        { 
          userId: 'user2', 
          videoId: 'video123', 
          annotations: [{ id: 'a2' }],
          toObject: jest.fn().mockReturnValue({
            userId: 'user2', 
            videoId: 'video123', 
            annotations: [{ id: 'a2' }]
          })
        }
      ];
      
      const mockExec = jest.fn().mockResolvedValue(mockAnnotationDocs);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      Annotation.find = jest.fn().mockReturnValue({ populate: mockPopulate });
      
      await getUsersWithAnnotationsForVideo(req, res);
      
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should handle no annotations found', async () => {
      req.params = { videoId: 'video123' };
      
      Annotation.distinct = jest.fn().mockResolvedValue([]);
      
      res.status = jest.fn().mockReturnThis();
      res.json = jest.fn();
      
      await getUsersWithAnnotationsForVideo(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
    });
    
    test('should handle errors', async () => {
      req.params = { videoId: 'video123' };
      
      Annotation.distinct = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await getUsersWithAnnotationsForVideo(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'annotationDocs.map is not a function'
      });
    });
  });
});