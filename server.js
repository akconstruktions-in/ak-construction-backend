const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const projectRoutes = require('./routes/projectRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const snapshotRoutes = require('./routes/snapshotRoutes');

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

//
// CORS CONFIG
//
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://akconstructionbyraju.com",
    "https://www.akconstructionbyraju.com",
    "https://api.akconstructionbyraju.com"
  ],
  credentials: true,
}));

// Trust proxy for rate limiting behind Render/Vercel
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Static files (uploads)
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/snapshot', snapshotRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AK Constructions API is running', ts: Date.now() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
