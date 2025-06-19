import mongoose from 'mongoose';
import Annotation from '../../../backend/models/Annotation.js';
import { describe, test, expect } from '@jest/globals';

describe('Annotation Model', () => {
  test('should have the correct schema fields', () => {
    const schemaFields = Object.keys(Annotation.schema.paths);
    
    console.log('Annotation schema fields:', schemaFields);
    
    expect(schemaFields).toContain('videoId');
    expect(schemaFields).toContain('userId');
    expect(schemaFields).toContain('annotations');
    expect(schemaFields).toContain('comments');
    expect(schemaFields).toContain('createdAt');
    expect(schemaFields).toContain('updatedAt');
  });
  
  test('should enforce required fields', () => {
    expect(Annotation.schema.path('userId').isRequired).toBeTruthy();
    expect(Annotation.schema.path('videoId').isRequired).toBeTruthy();
  });
  
  test('should have timestamp fields', () => {
    expect(Annotation.schema.paths.createdAt).toBeDefined();
    expect(Annotation.schema.paths.updatedAt).toBeDefined();
  });
});