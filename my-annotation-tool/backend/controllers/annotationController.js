import Annotation from '../models/Annotation.js';

// Get annotations for a video
export const getAnnotations = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.query.userId;
    
    // If userId provided, filter by both video and user
    const query = userId ? { videoId, userId } : { videoId };
    const annotation = await Annotation.findOne(query);
    
    if (!annotation) {
      return res.status(200).json({ 
        annotations: [], 
        comments: {} 
      });
    }
    
    // Log annotation types for debugging
    const annotationTypes = {};
    if (annotation.annotations && Array.isArray(annotation.annotations)) {
      annotation.annotations.forEach(anno => {
        annotationTypes[anno.type] = (annotationTypes[anno.type] || 0) + 1;
      });
    }
    console.log(`Found ${annotation.annotations?.length || 0} annotations by types:`, annotationTypes);
    
    // Debug pencil and text annotations specifically
    const pencilAnnotations = (annotation.annotations || []).filter(a => a.type === 'pencil');
    const textAnnotations = (annotation.annotations || []).filter(a => a.type === 'text');
    
    console.log(`Pencil annotations: ${pencilAnnotations.length}`);
    pencilAnnotations.forEach((anno, i) => {
      console.log(`- Pencil #${i+1}: id=${anno.id || anno._id}, hasPoints=${!!anno.points}, pointCount=${anno.points?.length || 0}`);
    });
    
    console.log(`Text annotations: ${textAnnotations.length}`);
    textAnnotations.forEach((anno, i) => {
      console.log(`- Text #${i+1}: id=${anno.id || anno._id}, hasText=${!!anno.text}, text="${anno.text?.substring(0, 20)}${anno.text?.length > 20 ? '...' : ''}"`);
    });
    
    // Process the response to make comments accessible by annotation ID
    const processedResponse = { ...annotation.toObject() };
    
    // Ensure all annotations have IDs and fix any missing data
    if (processedResponse.annotations) {
      processedResponse.annotations = processedResponse.annotations.map(anno => {
        // Ensure annotation has ID
        if (!anno.id && anno._id) {
          anno.id = anno._id.toString();
        }
        
        // Fix pencil annotations without points
        if (anno.type === 'pencil' && (!anno.points || !Array.isArray(anno.points) || anno.points.length === 0)) {
          console.log(`Fixing pencil annotation ${anno.id} - missing points array`);
          anno.points = [
            { x: anno.x, y: anno.y },
            { x: anno.x + 1, y: anno.y + 1 }
          ];
        }
        
        // Fix text annotations without text
        if (anno.type === 'text' && (!anno.text || anno.text.trim() === '')) {
          console.log(`Fixing text annotation ${anno.id} - missing text content`);
          anno.text = "Text annotation";
        }
        
        return anno;
      });
    }
    
    // Create processed comments object with annotation IDs as keys
    const processedComments = {};
    
    // Initialize empty arrays for each annotation
    if (annotation.annotations && Array.isArray(annotation.annotations)) {
      annotation.annotations.forEach(anno => {
        const annoId = anno.id || (anno._id ? anno._id.toString() : null);
        if (annoId) {
          processedComments[annoId] = [];
        }
      });
    }
    
    // Process comments and map them to the right annotation IDs
    if (annotation.comments && typeof annotation.comments === 'object') {
      Object.keys(annotation.comments).forEach(commentKey => {
        const commentArray = annotation.comments[commentKey];
        
        if (Array.isArray(commentArray)) {
          commentArray.forEach(comment => {
            // Try to find the annotation this comment belongs to
            const annotationId = comment.annotationId || commentKey;
            
            // Ensure each comment has _id for React keys
            if (!comment._id) {
              comment._id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            }
            
            // If we have a corresponding annotation ID in our processed comments
            if (processedComments[annotationId]) {
              processedComments[annotationId].push(comment);
            } else {
              // If we don't have this annotation ID yet, add it
              processedComments[annotationId] = [comment];
            }
          });
        }
      });
    }
    
    // Replace the original comments with our processed version
    processedResponse.comments = processedComments;
    
    // Log what we're sending back
    console.log(`Processed ${Object.keys(processedComments).length} annotation comment arrays`);
    
    // Log any annotation IDs with comments for debugging
    Object.keys(processedComments).forEach(key => {
      if (processedComments[key].length > 0) {
        console.log(`Annotation ${key} has ${processedComments[key].length} comments`);
      }
    });
    
    res.json(processedResponse);
  } catch (error) {
    console.error('❌ Error retrieving annotations:', error);
    res.status(500).json({ message: 'Error retrieving annotations', error });
  }
};

// Create or update annotations with user tracking
export const saveAnnotations = async (req, res) => {
  try {
    const { videoId, userId, annotations, comments } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ message: 'Missing videoId' });
    }
    
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }
    
    console.log(`Saving annotations for video ${videoId} by user ${userId}`);
    
    // Log annotation types for debugging
    const annotationTypes = {};
    if (Array.isArray(annotations)) {
      annotations.forEach(anno => {
        annotationTypes[anno.type] = (annotationTypes[anno.type] || 0) + 1;
      });
    }
    console.log(`Saving ${annotations?.length || 0} annotations by types:`, annotationTypes);
    
    // Validate and clean annotations before saving
    const cleanedAnnotations = Array.isArray(annotations) 
      ? annotations.map(anno => {
          // Add user ID to each annotation if not already present
          const annotationWithUser = {
            ...anno,
            userId: anno.userId || userId
          };
          
          // Special handling for pencil annotations
          if (anno.type === 'pencil') {
            // Ensure points exists and is an array
            if (!anno.points || !Array.isArray(anno.points) || anno.points.length === 0) {
              console.log(`Fixing pencil annotation ${anno.id} - missing points array`);
              annotationWithUser.points = [
                { x: anno.x, y: anno.y },
                { x: anno.x + 1, y: anno.y + 1 }
              ];
            } else {
              // Ensure points are properly formatted numbers
              annotationWithUser.points = anno.points.map(p => ({
                x: Number(p.x),
                y: Number(p.y)
              }));
            }
          }
          
          // Special handling for text annotations
          if (anno.type === 'text') {
            // Ensure text exists and is not empty
            if (!anno.text || anno.text.trim() === '') {
              console.log(`Fixing text annotation ${anno.id} - missing text content`);
              annotationWithUser.text = "Text annotation";
            }
          }
          
          return annotationWithUser;
        })
      : [];
    
    // First try to find an existing annotation by both videoId and userId
    let updatedAnnotation = await Annotation.findOne({ videoId, userId });
    
    if (updatedAnnotation) {
      // Update existing annotation for this user and video
      console.log(`Updating annotations for video ${videoId} by user ${userId}`);
      console.log(`Saving ${cleanedAnnotations.length} annotations with ${Object.keys(comments || {}).length} comment entries`);
      
      updatedAnnotation.annotations = cleanedAnnotations;
      updatedAnnotation.comments = comments;
      await updatedAnnotation.save();
    } else {
      // Create new annotation document with user ID
      console.log(`Creating new annotation document for video ${videoId} by user ${userId}`);
      
      updatedAnnotation = await Annotation.create({
        videoId,
        userId,
        annotations: cleanedAnnotations,
        comments
      });
    }
    
    res.status(200).json({ message: 'Annotations saved successfully', updatedAnnotation });
  } catch (error) {
    console.error('❌ Error saving annotations:', error);
    res.status(500).json({ message: 'Error saving annotations', error });
  }
};

// Delete an annotation
export const deleteAnnotation = async (req, res) => {
  try {
    const { id } = req.params;
    await Annotation.findByIdAndDelete(id);
    res.json({ message: 'Annotation deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting annotation:', error);
    res.status(500).json({ message: 'Error deleting annotation', error });
  }
};

// Get all annotations for a user
export const getUserAnnotations = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const annotations = await Annotation.find({ userId });
    
    res.json(annotations);
  } catch (error) {
    console.error('❌ Error retrieving user annotations:', error);
    res.status(500).json({ message: 'Error retrieving user annotations', error });
  }
};

// Get all users who have annotations for a specific video
export const getUsersWithAnnotationsForVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Find all annotation documents for this video
    const annotationDocs = await Annotation.find({ videoId })
      .populate('userId', 'username');
    
    if (!annotationDocs || annotationDocs.length === 0) {
      return res.status(404).json({ 
        message: 'No users have annotated this video yet'
      });
    }
    
    // Format the response for the frontend
    const usersWithAnnotations = annotationDocs.map(doc => ({
      userId: doc.userId._id,
      username: doc.userId.username,
      annotations: doc.annotations || []
    }));
    
    console.log(`Found ${usersWithAnnotations.length} users with annotations for video ${videoId}`);
    res.json(usersWithAnnotations);
  } catch (error) {
    console.error('Error fetching users with annotations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};