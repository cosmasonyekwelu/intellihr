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

const writeStartupLog = (message: string) => {
  process.stdout.write(`${message}\n`);
};

const describeMongoUri = (uri: string) => {
  try {
    const parsed = new URL(uri);
    const database = parsed.pathname?.replace('/', '') || '(no database name)';
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}/${database}`;
  } catch {
    return '(invalid MongoDB URI format)';
  }
};

const getMongoDatabaseName = (uri: string) => {
  try {
    return new URL(uri).pathname.replace('/', '').trim();
  } catch {
    return '';
  }
};

if (isProduction && !getMongoDatabaseName(process.env.MONGODB_URI as string)) {
  throw new Error('MONGODB_URI must include a database name, for example mongodb+srv://USER:PASSWORD@cluster.mongodb.net/intellihr?retryWrites=true&w=majority');
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

writeStartupLog('[Database] Attempting connection to MongoDB.');
writeStartupLog(`[Database] Target: ${describeMongoUri(MONGODB_URI as string)}`);
mongoose
  .connect(MONGODB_URI as string, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000
  })
  .then(() => {
    writeStartupLog('[Database] MongoDB Connected Successfully.');
    app.listen(PORT, () => {
      writeStartupLog(`[Server] IntelliHR backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    writeStartupLog(`[Database] Connection Error: ${err.name || 'MongoConnectionError'}`);
    writeStartupLog(`[Database] Details: ${err.message}`);
    writeStartupLog('[Database] Check MONGODB_URI, Atlas Network Access, database user credentials, and URL-encoded password characters.');
    setTimeout(() => process.exit(1), 3000);
  });
