import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './backend/config/db.js'; 
import annotationRoutes from './backend/routes/annotationRoutes.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/annotations', annotationRoutes);

const PORT = process.env.PORT || 5000;

// Connect to Database and Start Server
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('❌ MongoDB Connection Failed:', error);
  });
