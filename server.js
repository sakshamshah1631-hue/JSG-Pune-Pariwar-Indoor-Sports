const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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
  city: { type: String, required: false, default: 'N/A' },
  jsgGroup: { type: String, required: false, default: 'N/A' },

  emergencyContact: {
    type: String,
    default: 'N/A'
  },

  medicalConditions: {
    type: String,
    default: 'None'
  },

  selectedSports: [
    {
      sportName: String,
      ageCategory: String
    }
  ],

  july12Sports: [
    {
      sportName: String,
      ageCategory: String
    }
  ],

  july19Sports: [
    {
      sportName: String,
      ageCategory: String
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Registration = mongoose.model('Registration', registrationSchema);

// Admin Login
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

// Clear all registrations and backups (admin only)
app.post('/api/admin/clear-data', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const deleteResult = await Registration.deleteMany({});

    // remove backup files
    try {
      const files = fs.readdirSync(backupsDir || path.join(__dirname, 'backups'));
      files.forEach(file => {
        if (file.toLowerCase().endsWith('.xlsx')) {
          const f = path.join(backupsDir, file);
          fs.unlinkSync(f);
        }
      });
    } catch (e) {
      console.warn('Error clearing backups folder:', e.message);
    }

    res.json({ success: true, message: 'All registrations and backups cleared', deleted: deleteResult.deletedCount });
  } catch (err) {
    console.error('Clear data error:', err);
    res.status(500).json({ success: false, message: 'Error clearing data' });
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

    workbook.creator = 'JSG Pune Smart City';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Registrations');

    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Gender', key: 'gender', width: 15 },
      { header: 'Group', key: 'group', width: 15 },
      { header: 'Mobile', key: 'mobile', width: 18 },
      { header: 'Emergency Contact', key: 'emergencyContact', width: 20 },
      { header: 'Medical Conditions', key: 'medicalConditions', width: 30 },
      { header: 'Selected Sports & Category', key: 'sports', width: 65 },
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

      const selectedSportsArray = Array.isArray(reg.selectedSports) && reg.selectedSports.length
        ? reg.selectedSports
        : [
            ...(Array.isArray(reg.july12Sports) ? reg.july12Sports : []),
            ...(Array.isArray(reg.july19Sports) ? reg.july19Sports : [])
          ];

      const sportsSummary = selectedSportsArray.length
        ? selectedSportsArray
            .map(s => {
              const name = (s.sportName || '').toString();
              if (name.toLowerCase() === 'only attending the event') return 'Only attending the event';
              return `${name} (${s.ageCategory || 'N/A'})`;
            })
            .join(', ')
        : 'None';

      worksheet.addRow({
        fullName: reg.fullName,
        age: reg.age,
        gender: reg.gender,
        group: reg.jsgGroup || 'N/A',
        mobile: reg.mobile,
        emergencyContact: reg.emergencyContact,
        medicalConditions: reg.medicalConditions,
        sports: sportsSummary,
        date: new Date(reg.createdAt).toLocaleString('en-IN')
      });

    });

    // Auto Filter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'I1'
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

// Backups folder and scheduled backups
const backupsDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

async function createBackup() {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 }).lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'JSG Pune Smart City';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Registrations');

    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Gender', key: 'gender', width: 15 },
      { header: 'Group', key: 'group', width: 15 },
      { header: 'Mobile', key: 'mobile', width: 18 },
      { header: 'Emergency Contact', key: 'emergencyContact', width: 20 },
      { header: 'Medical Conditions', key: 'medicalConditions', width: 30 },
      { header: 'Selected Sports & Category', key: 'sports', width: 65 },
      { header: 'Registration Date & Time', key: 'date', width: 28 }
    ];

    // Header Styling
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    registrations.forEach((reg) => {
      const selectedSportsArray = Array.isArray(reg.selectedSports) && reg.selectedSports.length
        ? reg.selectedSports
        : [
            ...(Array.isArray(reg.july12Sports) ? reg.july12Sports : []),
            ...(Array.isArray(reg.july19Sports) ? reg.july19Sports : [])
          ];

      const sportsSummary = selectedSportsArray.length
        ? selectedSportsArray
            .map(s => {
              const name = (s.sportName || '').toString();
              if (name.toLowerCase() === 'only attending the event') return 'Only attending the event';
              return `${name} (${s.ageCategory || 'N/A'})`;
            })
            .join(', ')
        : 'None';

      worksheet.addRow({
        fullName: reg.fullName,
        age: reg.age,
        gender: reg.gender,
        group: reg.jsgGroup || 'N/A',
        mobile: reg.mobile,
        emergencyContact: reg.emergencyContact,
        medicalConditions: reg.medicalConditions,
        sports: sportsSummary,
        date: new Date(reg.createdAt).toLocaleString('en-IN')
      });
    });

    const timestamp = new Date().toISOString().replace(/[:]/g, '-');
    const fileName = `JSG_Registrations_${timestamp}.xlsx`;
    const filePath = path.join(backupsDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    console.log('Backup created:', filePath);
    return filePath;
  } catch (err) {
    console.error('Backup Error:', err);
    throw err;
  }
}

// Create immediate backup on startup
createBackup().catch(err => console.error('Initial backup failed:', err));

// Schedule backups every 24 hours
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
setInterval(() => {
  createBackup().catch(err => console.error('Scheduled backup failed:', err));
}, ONE_DAY_MS);

// Admin endpoints to list and download backups
app.get('/api/admin/backups', (req, res) => {
  try {
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.toLowerCase().endsWith('.xlsx'))
      .sort((a, b) => b.localeCompare(a));
    res.json({ success: true, files });
  } catch (err) {
    console.error('List backups error:', err);
    res.status(500).json({ success: false, message: 'Unable to read backups' });
  }
});

app.get('/api/admin/backups/download', (req, res) => {
  try {
    const file = req.query.file;
    if (!file) return res.status(400).send('Missing file param');
    // Prevent path traversal
    if (file.includes('..') || path.basename(file) !== file) return res.status(400).send('Invalid file');
    const filePath = path.join(backupsDir, file);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
    res.download(filePath);
  } catch (err) {
    console.error('Download backup error:', err);
    res.status(500).send('Error downloading file');
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 