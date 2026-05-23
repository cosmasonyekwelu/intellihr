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

// Load variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Generated Payslips Statically
const publicDir = path.join(__dirname, '..', 'public');
app.use('/payslips', express.static(path.join(publicDir, 'payslips')));

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intellihr';

console.log(`[Database] Attempting connection to MongoDB at: ${MONGODB_URI}`);
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('[Database] MongoDB Connected Successfully.');
    app.listen(PORT, () => {
      console.log(`[Server] IntelliHR backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Database] Connection Error:', err.message);
    console.log('[Fallback] Starting Express Server with mocked database status.');
    
    // Start server even if MongoDB is offline to keep development feedback responsive
    app.listen(PORT, () => {
      console.log(`[Server] IntelliHR server running in fallback mode on http://localhost:${PORT}`);
    });
  });
