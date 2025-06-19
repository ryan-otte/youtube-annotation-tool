const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables

const app = express();

// Debugging log
console.log('Starting server...');

// Check if MONGO_URI is correctly loaded
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is missing from .env file');
  process.exit(1); // Stop execution if missing
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Test Route
app.get('/', (req, res) => {
  console.log('✔ Test route accessed');
  res.send('Server is running...');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
