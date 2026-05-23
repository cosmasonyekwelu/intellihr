import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { Employee } from '../models/Employee';
import employeeRoutes from '../routes/employeeRoutes';

const app = express();
app.use(express.json());

// Mock auth middleware for testing
const mockAuth = (req: any, res: any, next: any) => {
  req.user = { id: 'testuser', role: 'admin' };
  next();
};

// We need to bypass the real authenticateJWT and requireRoles
// In the test we can just use the router but we need to mock the middlewares it uses
jest.mock('../middleware/auth', () => ({
  authenticateJWT: (req: any, res: any, next: any) => {
    req.user = { id: 'testuser', role: 'admin' };
    next();
  },
  requireRoles: (roles: string[]) => (req: any, res: any, next: any) => next()
}));

app.use('/api/employees', employeeRoutes);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Employee Documents & Photo Upload API', () => {
  let employeeId: string;

  beforeEach(async () => {
    await Employee.deleteMany({});
    const emp = await Employee.create({
      name: 'Test Employee',
      email: 'test@example.com',
      phone: '1234567890',
      position: 'Developer',
      department: 'IT',
      salary: 5000,
      hireDate: new Date(),
      status: 'active'
    });
    employeeId = emp._id.toString();
  });

  it('should generate an offer letter PDF', async () => {
    const res = await request(app).get(`/api/employees/${employeeId}/offer-letter`);
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/pdf');
    expect(res.header['content-disposition']).toContain('offer_letter');
  });

  it('should generate a contract PDF', async () => {
    const res = await request(app).get(`/api/employees/${employeeId}/contract`);
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/pdf');
    expect(res.header['content-disposition']).toContain('contract');
  });

  it('should upload an employee photo', async () => {
    // Create a dummy image file
    const testFilePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(testFilePath, 'dummy content');

    const res = await request(app)
      .put(`/api/employees/${employeeId}`)
      .attach('photo', testFilePath);

    expect(res.status).toBe(200);
    expect(res.body.employee.photoUrl).toContain('/uploads/photo-');

    fs.unlinkSync(testFilePath);
  });
});
