 Weekly Project log (Week of April 14, 2025)

## Summary
This week, i focused on enhancing the YouTube Annotation Tool by fixing several critical issues with the core annotation functionality and improving the overall user experience. i successfully implemented solutions for pencil drawing visibility, text annotations, video timestamp display in comments, and improved UI layout.

## Files Updated

1. `AnnotationOverlay.js` - Fixed pencil drawing rendering and text annotation display  
2. `SimpleCommentSection.js` - Added video timestamp support in comments  
3. `HomePage.js` - Improved UI layout and Mouse Mode button positioning  
4. `HomePage.css` - Updated styling for better UI layout  
5. `annotationController.js` - Enhanced validation and error handling  
6. `api.js` - Improved data handling and serialization  
7. `Annotation.js` (MongoDB schema) - Updated schema to support new features  

## Key Improvements

### 1. Fixed Pencil Annotation Rendering
- Improved SVG viewBox handling for proper rendering of freehand pencil annotations.
- Standardized formatting of coordinates to prevent malformed drawings.

### 2. Added Support for Text Annotations
- Ensured that text annotations appear with consistent styling and logic.
- Default fallback added for missing text content.

### 3. Enhanced Comment System with Video Timestamps
- Integrated video playback timestamp in each comment for better context.
- Updated schema and UI to support and display videoTime.

### 4. UI Layout Improvements
- Moved the Mouse Mode toggle into the toolbar.
- Updated Toolbar.js and HomePage.css to reflect a more consistent layout.

### 5. Schema and API Enhancements
- Improved data validation and error handling during annotation creation.
- Normalized points for freehand annotations and cleaned API payloads before saving.

## Technical Debt Addressed
- Fixed type mismatches in coordinate data.
- Improved SVG rendering logic across browsers.
- Standardized error handling across frontend and backend.

 


