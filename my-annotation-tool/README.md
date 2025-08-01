# YouTube Annotation Tool

This tool allows users to annotate YouTube videos with custom shapes, colors, and comments at precise timestamps. Built using the MERN stack (MongoDB, Express, React, Node.js), it integrates with the YouTube IFrame API to enable seamless playback and annotation overlay.

## Features

- Draw shapes (rectangles, circles) and freehand lines directly on videos
- Add text annotations and comments at specific timestamps
- Secure user authentication with session management
- Admin dashboard for user management
- Annotation saving and retrieval
- Password reset functionality

## Prerequisites

- Node.js (v14 or newer)
- MongoDB (local instance or MongoDB Atlas)
- npm or yarn

## Installation

1. Clone the repository:
   ```
  https://github.com/ryan-otte/youtube-annotation-tool.git
   ```

2. Install dependencies for both backend and frontend:
   ```
   npm install
   ```

## Running the Application

### Starting the Backend Server

1. Navigate to the project root directory:
   
   ```

2. Start the backend server:
   ```
   npm run server
   ```

3. The backend will start running on port 5000. You should see a message indicating the server is running successfully.

### Starting the Frontend Development Server

1. Open a new terminal window (keep the backend running in the first terminal)

2. Navigate to the project root directory again:
   ```

3. Start the frontend application:
   ```
   npm start
   ```

4. When prompted that something is already running on port 5000 and if you want to use another port, select "Yes". The frontend will then start on port 5001.

5. A new browser tab will automatically open, launching the application at http://localhost:5001

## Using the Application

1. Register for a new account or login with existing credentials
2. Enter a YouTube URL to load a video
3. Use the toolbar to select annotation tools (rectangle, circle, pencil, text)
4. Create annotations at specific points in the video timeline
5. Save your annotations and they will appear at the appropriate timestamps during playback

## Testing

Run tests with the following command:
```
npm run test:backend:coverage
```

This will execute the test suite using Jest.





