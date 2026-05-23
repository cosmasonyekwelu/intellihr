"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("./src/models/User");
const Employee_1 = require("./src/models/Employee");
const Attendance_1 = require("./src/models/Attendance");
const LeaveRequest_1 = require("./src/models/LeaveRequest");
const Payroll_1 = require("./src/models/Payroll");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intellihr';
async function seed() {
    console.log('[Seed] Opening connection to database...');
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('[Seed] Connected.');
    // Clean collections
    console.log('[Seed] Cleaning existing data...');
    await User_1.User.deleteMany({});
    await Employee_1.Employee.deleteMany({});
    await Attendance_1.Attendance.deleteMany({});
    await LeaveRequest_1.LeaveRequest.deleteMany({});
    await Payroll_1.Payroll.deleteMany({});
    console.log('[Seed] Collections cleared.');
    // 1. Create Employees
    console.log('[Seed] Generating employees...');
    const employeesData = [
        {
            name: 'John Doe',
            email: 'john@intellihr.com',
            phone: '+1 555-0199',
            position: 'Senior Software Engineer',
            department: 'Engineering',
            salary: 7500,
            hireDate: new Date('2024-01-15'),
            status: 'active',
            performanceRating: 4
        },
        {
            name: 'Alice Smith',
            email: 'alice@intellihr.com',
            phone: '+1 555-0144',
            position: 'HR Director',
            department: 'Human Resources',
            salary: 6200,
            hireDate: new Date('2023-06-01'),
            status: 'active',
            performanceRating: 5
        },
        {
            name: 'Bob Jones',
            email: 'bob@intellihr.com',
            phone: '+1 555-0188',
            position: 'Sales Executive',
            department: 'Sales',
            salary: 4000,
            hireDate: new Date('2024-08-10'),
            status: 'active',
            performanceRating: 2 // Underperforming employee
        },
        {
            name: 'Charlie Brown',
            email: 'charlie@intellihr.com',
            phone: '+1 555-0122',
            position: 'Marketing Specialist',
            department: 'Marketing',
            salary: 4800,
            hireDate: new Date('2024-03-22'),
            status: 'on_leave',
            performanceRating: 3
        },
        {
            name: 'David Miller',
            email: 'david@intellihr.com',
            phone: '+1 555-0166',
            position: 'DevOps Engineer',
            department: 'Engineering',
            salary: 7100,
            hireDate: new Date('2024-02-18'),
            status: 'active',
            performanceRating: 4
        }
    ];
    const employees = await Employee_1.Employee.create(employeesData);
    console.log(`[Seed] Successfully created ${employees.length} employee records.`);
    // 2. Create Users
    console.log('[Seed] Generating user accounts with secure hashes...');
    const salt = await bcryptjs_1.default.genSalt(10);
    const defaultPassword = await bcryptjs_1.default.hash('password123', salt);
    const johnEmp = employees.find(e => e.email === 'john@intellihr.com');
    const aliceEmp = employees.find(e => e.email === 'alice@intellihr.com');
    const usersData = [
        {
            name: 'Admin Master',
            email: 'admin@intellihr.com',
            password: defaultPassword,
            role: 'admin',
            employeeId: null
        },
        {
            name: 'Alice Smith (HR)',
            email: 'hr@intellihr.com',
            password: defaultPassword,
            role: 'hr_manager',
            employeeId: aliceEmp?._id || null
        },
        {
            name: 'John Doe (Dev)',
            email: 'employee@intellihr.com',
            password: defaultPassword,
            role: 'employee',
            employeeId: johnEmp?._id || null
        }
    ];
    const users = await User_1.User.create(usersData);
    console.log(`[Seed] Created ${users.length} authenticated users.`);
    // 3. Create Attendance Logs for John Doe (Current Month - May 2026)
    console.log('[Seed] Generating attendance logs...');
    const logs = [];
    const year = 2026;
    const month = 4; // May (0-indexed represents May? Wait, 0=Jan, 1=Feb, 2=Mar, 3=Apr, 4=May!)
    // Seed attendance for 10 weekdays in May 2026
    for (let day = 1; day <= 15; day++) {
        const logDate = new Date(year, month, day);
        const dayOfWeek = logDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6)
            continue; // Skip weekends
        let status = 'present';
        let checkIn = new Date(year, month, day, 8, 45, 0);
        let checkOut = new Date(year, month, day, 17, 0, 0);
        if (day === 5) {
            status = 'late';
            checkIn = new Date(year, month, day, 9, 30, 0); // Late check-in
        }
        else if (day === 12) {
            status = 'absent';
            checkIn = null;
            checkOut = null;
        }
        logs.push({
            employeeId: johnEmp?._id,
            date: logDate,
            checkIn,
            checkOut,
            status
        });
    }
    // Also add some logs for Bob Jones (Sales Rep with absences)
    const bobEmp = employees.find(e => e.email === 'bob@intellihr.com');
    for (let day = 1; day <= 10; day++) {
        const logDate = new Date(year, month, day);
        const dayOfWeek = logDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6)
            continue; // Skip weekends
        let status = 'present';
        let checkIn = new Date(year, month, day, 8, 50, 0);
        let checkOut = new Date(year, month, day, 17, 0, 0);
        if (day === 4 || day === 9) {
            status = 'absent';
            checkIn = null;
            checkOut = null;
        }
        logs.push({
            employeeId: bobEmp?._id,
            date: logDate,
            checkIn,
            checkOut,
            status
        });
    }
    const attendanceRecords = await Attendance_1.Attendance.create(logs);
    console.log(`[Seed] Seeded ${attendanceRecords.length} attendance sheets.`);
    // 4. Create Leave Requests
    console.log('[Seed] Generating leave requests...');
    const charlieEmp = employees.find(e => e.email === 'charlie@intellihr.com');
    const leavesData = [
        {
            employeeId: johnEmp?._id,
            type: 'annual',
            startDate: new Date('2026-06-10'),
            endDate: new Date('2026-06-15'),
            reason: 'Family summer vacation plan.',
            status: 'pending'
        },
        {
            employeeId: charlieEmp?._id,
            type: 'sick',
            startDate: new Date('2026-05-18'),
            endDate: new Date('2026-05-20'),
            reason: 'Undergoing regular medical checkup.',
            status: 'approved'
        },
        {
            employeeId: bobEmp?._id,
            type: 'unpaid',
            startDate: new Date('2026-04-05'),
            endDate: new Date('2026-04-08'),
            reason: 'Urgent personal matters.',
            status: 'rejected'
        }
    ];
    const leaves = await LeaveRequest_1.LeaveRequest.create(leavesData);
    console.log(`[Seed] Generated ${leaves.length} leave requests.`);
    console.log('[Seed] Closing database connection...');
    await mongoose_1.default.connection.close();
    console.log('[Seed] Seeding process complete!');
}
seed().catch(err => {
    console.error('[Seed Error]:', err);
    process.exit(1);
});
