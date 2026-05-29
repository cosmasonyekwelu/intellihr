import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Route Imports
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import leaveRoutes from './routes/leaveRoutes';
import payrollRoutes from './routes/payrollRoutes';
import aiRoutes from './routes/aiRoutes';
import leaveTypeRoutes from './routes/leaveTypeRoutes';
import profileRoutes from './routes/profileRoutes';

// Load variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction) {
  ['JWT_SECRET', 'MONGODB_URI', 'FRONTEND_URL'].forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`${key} is required in production`);
    }
  });

  if (allowedOrigins.length === 0) {
    throw new Error('CORS_ORIGIN or FRONTEND_URL is required in production');
  }
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Generated Payslips Statically
const publicDir = path.join(__dirname, '..', 'public');
app.use('/payslips', express.static(path.join(publicDir, 'payslips')));
app.use('/uploads', express.static(path.join(publicDir, 'uploads')));

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/leave-types', leaveTypeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to IntelliHR HR & Payroll Automation Platform API',
    status: 'online',
    version: '1.0.0'
  });
});

// Database Connection & Server Startup
const MONGODB_URI = process.env.MONGODB_URI;

console.log('[Database] Attempting connection to MongoDB.');
mongoose
  .connect(MONGODB_URI as string, {
    serverSelectionTimeoutMS: 10000
  })
  .then(() => {
    console.log('[Database] MongoDB Connected Successfully.');
    app.listen(PORT, () => {
      console.log(`[Server] IntelliHR backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Database] Connection Error:', err.name || 'MongoConnectionError');
    console.error('[Database] Details:', err.message);
    console.error('[Database] Check MONGODB_URI, Atlas network access, database user credentials, and URL-encoded password characters.');
    process.exit(1);
  });
