const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Department = require("../models/Department");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");

const seedDatabase = async (shouldExit = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    console.log("Cleaning existing records...");

    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Employee.deleteMany({}),
      Attendance.deleteMany({}),
      Leave.deleteMany({}),
    ]);

    console.log("Creating departments...");
    const engineering = await Department.create({
      name: "Engineering",
      code: "ENG",
      description: "Software engineering, DevOps, and cloud infrastructure.",
      location: "Tower A, 4th Floor",
      budget: 500000,
    });

    const hr = await Department.create({
      name: "Human Resources",
      code: "HR",
      description: "Talent acquisition, employee welfare, and operations.",
      location: "Tower A, 2nd Floor",
      budget: 150000,
    });

    const design = await Department.create({
      name: "Product & Design",
      code: "PRD",
      description: "UI/UX design, product strategy, and user research.",
      location: "Tower B, 3rd Floor",
      budget: 200000,
    });

    const marketing = await Department.create({
      name: "Marketing",
      code: "MKT",
      description: "Growth, content, partnerships, and brand strategy.",
      location: "Tower B, 1st Floor",
      budget: 180000,
    });

    const finance = await Department.create({
      name: "Finance & Accounts",
      code: "FIN",
      description: "Corporate finance, payroll, and auditing.",
      location: "Tower A, 3rd Floor",
      budget: 120000,
    });

    console.log("Creating employees...");
    const employeesData = [
      {
        employeeId: "EMP-001",
        fullName: "Alex Rivera",
        email: "admin@nexus.com",
        phone: "+1 (555) 234-5678",
        gender: "Male",
        dob: new Date("1988-04-12"),
        department: engineering._id,
        designation: "Chief Technology Officer",
        salary: 135000,
        joiningDate: new Date("2021-01-15"),
        employmentType: "Full-time",
        employmentStatus: "Active",
        address: { street: "100 Tech Blvd", city: "San Francisco", state: "CA", zipCode: "94105", country: "USA" },
      },
      {
        employeeId: "EMP-002",
        fullName: "Elena Rostova",
        email: "hr@nexus.com",
        phone: "+1 (555) 345-6789",
        gender: "Female",
        dob: new Date("1992-08-23"),
        department: hr._id,
        designation: "HR Director",
        salary: 95000,
        joiningDate: new Date("2021-06-01"),
        employmentType: "Full-time",
        employmentStatus: "Active",
        address: { street: "450 Market St", city: "San Francisco", state: "CA", zipCode: "94103", country: "USA" },
      },
      {
        employeeId: "EMP-003",
        fullName: "Marcus Chen",
        email: "employee@nexus.com",
        phone: "+1 (555) 456-7890",
        gender: "Male",
        dob: new Date("1995-11-05"),
        department: engineering._id,
        designation: "Senior Full-Stack Engineer",
        salary: 110000,
        joiningDate: new Date("2022-03-10"),
        employmentType: "Full-time",
        employmentStatus: "Active",
        address: { street: "782 Fremont St", city: "San Jose", state: "CA", zipCode: "95112", country: "USA" },
      },
      {
        employeeId: "EMP-004",
        fullName: "Sophia Martinez",
        email: "sophia.m@nexus.com",
        phone: "+1 (555) 567-8901",
        gender: "Female",
        dob: new Date("1994-02-18"),
        department: design._id,
        designation: "Lead Product Designer",
        salary: 102000,
        joiningDate: new Date("2022-07-15"),
        employmentType: "Full-time",
        employmentStatus: "Active",
        address: { street: "210 Mission St", city: "San Francisco", state: "CA", zipCode: "94105", country: "USA" },
      },
      {
        employeeId: "EMP-005",
        fullName: "David Kim",
        email: "david.kim@nexus.com",
        phone: "+1 (555) 678-9012",
        gender: "Male",
        dob: new Date("1996-09-30"),
        department: marketing._id,
        designation: "Growth Marketing Specialist",
        salary: 82000,
        joiningDate: new Date("2023-02-01"),
        employmentType: "Full-time",
        employmentStatus: "Active",
        address: { street: "330 4th Ave", city: "Oakland", state: "CA", zipCode: "94612", country: "USA" },
      },
      {
        employeeId: "EMP-006",
        fullName: "Aaliyah Patel",
        email: "aaliyah.p@nexus.com",
        phone: "+1 (555) 789-0123",
        gender: "Female",
        dob: new Date("1991-12-14"),
        department: finance._id,
        designation: "Senior Financial Analyst",
        salary: 92000,
        joiningDate: new Date("2022-10-10"),
        employmentType: "Full-time",
        employmentStatus: "Active",
        address: { street: "88 Pine St", city: "San Francisco", state: "CA", zipCode: "94111", country: "USA" },
      },
      {
        employeeId: "EMP-007",
        fullName: "Jordan Taylor",
        email: "jordan.t@nexus.com",
        phone: "+1 (555) 890-1234",
        gender: "Other",
        dob: new Date("1997-06-21"),
        department: engineering._id,
        designation: "Junior Cloud Engineer",
        salary: 75000,
        joiningDate: new Date("2023-08-15"),
        employmentType: "Full-time",
        employmentStatus: "Active",
        address: { street: "550 Battery St", city: "San Francisco", state: "CA", zipCode: "94111", country: "USA" },
      },
      {
        employeeId: "EMP-008",
        fullName: "Hannah Becker",
        email: "hannah.b@nexus.com",
        phone: "+1 (555) 901-2345",
        gender: "Female",
        dob: new Date("1993-03-27"),
        department: hr._id,
        designation: "Talent Acquisition Associate",
        salary: 68000,
        joiningDate: new Date("2023-11-01"),
        employmentType: "Contract",
        employmentStatus: "Active",
        address: { street: "1200 California St", city: "San Francisco", state: "CA", zipCode: "94109", country: "USA" },
      },
    ];

    const createdEmployees = await Employee.insertMany(employeesData);

    // Set Department Heads
    engineering.head = createdEmployees[0]._id;
    await engineering.save();

    hr.head = createdEmployees[1]._id;
    await hr.save();

    design.head = createdEmployees[3]._id;
    await design.save();

    console.log("Creating default users with bcrypt passwords...");
    // 1. Admin
    const adminUser = await User.create({
      name: "Alex Rivera",
      email: "admin@nexus.com",
      password: "admin123", // Will be hashed by userSchema.pre('save')
      role: "Admin",
      employeeId: createdEmployees[0]._id,
    });
    createdEmployees[0].user = adminUser._id;
    await createdEmployees[0].save();

    // 2. HR Manager
    const hrUser = await User.create({
      name: "Elena Rostova",
      email: "hr@nexus.com",
      password: "hr123456",
      role: "HR Manager",
      employeeId: createdEmployees[1]._id,
    });
    createdEmployees[1].user = hrUser._id;
    await createdEmployees[1].save();

    // 3. Employee
    const empUser = await User.create({
      name: "Marcus Chen",
      email: "employee@nexus.com",
      password: "emp12345",
      role: "Employee",
      employeeId: createdEmployees[2]._id,
    });
    createdEmployees[2].user = empUser._id;
    await createdEmployees[2].save();

    console.log("Creating sample attendance...");
    const today = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    // Sample attendance for today
    for (let i = 0; i < createdEmployees.length; i++) {
      const emp = createdEmployees[i];
      const checkInTime = new Date();
      checkInTime.setHours(9, Math.floor(Math.random() * 30), 0);

      const status = i === 4 ? "Absent" : i === 6 ? "Late" : "Present";

      if (status !== "Absent") {
        await Attendance.create({
          employee: emp._id,
          date: todayStr,
          checkIn: checkInTime,
          checkOut: null,
          workingHours: 0,
          status,
          notes: status === "Late" ? "Transit delay" : "Regular check-in",
        });
      }
    }

    console.log("Creating sample leaves...");
    const nextWeekStart = new Date();
    nextWeekStart.setDate(today.getDate() + 7);
    const nextWeekEnd = new Date();
    nextWeekEnd.setDate(today.getDate() + 10);

    await Leave.create({
      employee: createdEmployees[2]._id, // Marcus Chen
      leaveType: "Annual",
      startDate: nextWeekStart,
      endDate: nextWeekEnd,
      daysCount: 4,
      reason: "Family vacation and annual travel.",
      status: "Pending",
    });

    const pastStart = new Date();
    pastStart.setDate(today.getDate() - 14);
    const pastEnd = new Date();
    pastEnd.setDate(today.getDate() - 12);

    await Leave.create({
      employee: createdEmployees[3]._id, // Sophia Martinez
      leaveType: "Sick",
      startDate: pastStart,
      endDate: pastEnd,
      daysCount: 3,
      reason: "Medical recovery following influenza.",
      status: "Approved",
      actionBy: hrUser._id,
      actionAt: new Date(pastStart.getTime() - 86400000),
      actionComment: "Approved. Take rest and recover well.",
    });

    console.log("====================================================");
    console.log("NEXUS EMS Seed Completed Successfully!");
    console.log("====================================================");
    console.log("Default Admin Account:");
    console.log("  Email:    admin@nexus.com");
    console.log("  Password: admin123");
    console.log("----------------------------------------------------");
    console.log("Default HR Manager Account:");
    console.log("  Email:    hr@nexus.com");
    console.log("  Password: hr123456");
    console.log("----------------------------------------------------");
    console.log("Default Employee Account:");
    console.log("  Email:    employee@nexus.com");
    console.log("  Password: emp12345");
    console.log("====================================================");

    if (shouldExit) {
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error("Seeding failed:", error);
    if (shouldExit) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedDatabase(true);
}

module.exports = { seedDatabase };
