const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGODB_URI = 'mongodb+srv://sakshamshah1631_db_user:gl93d8p9W7prg3PL@cluster0.efp3ibc.mongodb.net/?appName=Cluster0';

// Middleware
app.use(cors());
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, '')));

mongoose.set('strictQuery', false);

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Schema
const registrationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  age: { type: String, required: true },
  gender: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: false },
  city: { type: String, required: true },
  jsgGroup: { type: String, required: true },

  emergencyContact: {
    type: String,
    default: 'N/A'
  },

  medicalConditions: {
    type: String,
    default: 'None'
  },

  july12Sports: [
    {
      sportName: String,
      ageCategory: String,
    }
  ],

  july19Sports: [
    {
      sportName: String,
      ageCategory: String,
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Registration = mongoose.model('Registration', registrationSchema);

// Admin Login
app.post('/api/admin/login', async (req, res) => {

  const { username, password } = req.body;

  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'password123';

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {

    res.json({
      success: true,
      message: 'Login successful'
    });

  } else {

    res.json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Submit Registration
app.post('/api/register', async (req, res) => {

  try {

    const registration = new Registration({
      ...req.body,
      createdAt: new Date(),
    });

    await registration.save();

    console.log('New Registration Saved');

    res.status(201).json({
      success: true,
      message: 'Registration saved successfully'
    });

  } catch (error) {

    console.error('Error saving registration:', error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Fetch All Registrations
app.get('/api/admin/registrations', async (req, res) => {

  try {

    const registrations = await Registration.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: registrations
    });

  } catch (error) {

    console.error('Error fetching registrations:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch registrations'
    });
  }
});

// Export Excel
app.get('/api/admin/export', async (req, res) => {

  try {

    const registrations = await Registration.find()
      .sort({ createdAt: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'JSG Pune Pariwar';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Registrations');

    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Gender', key: 'gender', width: 15 },
      { header: 'Mobile', key: 'mobile', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'City', key: 'city', width: 18 },
      { header: 'JSG Group', key: 'jsgGroup', width: 25 },
      { header: 'Emergency Contact', key: 'emergencyContact', width: 20 },
      { header: 'Medical Conditions', key: 'medicalConditions', width: 30 },
      { header: 'July 12 Sports', key: 'july12', width: 45 },
      { header: 'July 19 Sports', key: 'july19', width: 45 },
      { header: 'Registration Date & Time', key: 'date', width: 28 }
    ];

    // Header Styling
    worksheet.getRow(1).font = {
      bold: true,
      size: 12
    };

    worksheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center'
    };

    // Freeze top row
    worksheet.views = [
      { state: 'frozen', ySplit: 1 }
    ];

    registrations.forEach((reg) => {

      const july12String = reg.july12Sports?.length
        ? reg.july12Sports
            .map(s => `${s.sportName} (${s.ageCategory})`)
            .join(', ')
        : 'None';

      const july19String = reg.july19Sports?.length
        ? reg.july19Sports
            .map(s => `${s.sportName} (${s.ageCategory})`)
            .join(', ')
        : 'None';

      worksheet.addRow({
        fullName: reg.fullName,
        age: reg.age,
        gender: reg.gender,
        mobile: reg.mobile,
        email: reg.email,
        city: reg.city,
        jsgGroup: reg.jsgGroup,
        emergencyContact: reg.emergencyContact,
        medicalConditions: reg.medicalConditions,
        july12: july12String,
        july19: july19String,
        date: new Date(reg.createdAt).toLocaleString('en-IN')
      });

    });

    // Auto Filter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'L1'
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=JSG_Registrations.xlsx'
    );

    await workbook.xlsx.write(res);

    res.end();

  } catch (error) {

    console.error('Export Error:', error);

    res.status(500).send('Error generating spreadsheet report');
  }
});

// Fallback Route
app.use((req, res, next) => {

  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }

  next();
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});