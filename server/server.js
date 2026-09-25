require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const { initSocketIO } = require('./sockets/socketHandler');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const collegeConfigRoutes = require('./routes/collegeConfigRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const skillSwapRoutes = require('./routes/skillSwapRoutes');
const studyGroupRoutes = require('./routes/studyGroupRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const slotRoutes = require('./routes/slotRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const eventRoutes = require('./routes/eventRoutes');
const clubRoutes = require('./routes/clubRoutes');
const transportRoutes = require('./routes/transportRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const searchRoutes = require('./routes/searchRoutes');

const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO & CORS Setup
const parseClientUrls = () => {
  if (!process.env.CLIENT_URL) return [];
  return process.env.CLIENT_URL.split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);
};

const staticAllowedOrigins = [
  'https://college-smart-campus-1.onrender.com',
  'https://college-smart-campus-pfcr.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
  ...parseClientUrls(),
];

const isOriginAllowed = (origin, callback) => {
  // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
  if (!origin) {
    return callback(null, true);
  }

  const normalized = origin.trim().replace(/\/+$/, '');

  // 1. Check exact configured list
  if (staticAllowedOrigins.includes(normalized)) {
    return callback(null, true);
  }

  // 2. Allow all localhost & 127.0.0.1 ports
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
    return callback(null, true);
  }

  // 3. Allow all Vercel deployment domains (*.vercel.app)
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(normalized)) {
    return callback(null, true);
  }

  // 4. Allow all Render deployment domains (*.onrender.com)
  if (/^https:\/\/[a-zA-Z0-9_-]+\.onrender\.com$/.test(normalized)) {
    return callback(null, true);
  }

  // 5. In development mode, allow all origins
  if (process.env.NODE_ENV !== 'production') {
    return callback(null, true);
  }

  return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
};

const io = new Server(server, {
  cors: {
    origin: isOriginAllowed,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  },
});
initSocketIO(io);

// Security & Parsing Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: isOriginAllowed,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Disposition'],
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate Limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' },
});
app.use('/api', apiLimiter);

// Static Uploads Folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    platform: 'CollegeHub Smart Campus Platform',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/college', collegeConfigRoutes);
app.use('/api/college-config', collegeConfigRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skillswap', skillSwapRoutes);
app.use('/api/study-groups', studyGroupRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', slotRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);

// 404 Route Handler for undefined APIs
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint ${req.originalUrl} not found.` });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start Express server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 [CollegeHub Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`🌐 [Socket.IO] Real-time engine active`);
    });
  })
  .catch((err) => {
    console.error('Fatal: Failed to initialize database server:', err);
    process.exit(1);
  });
