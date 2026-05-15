const express = require('express');
const bodyParser = require('body-parser');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// --- DATABASE CONNECTION ---
// Your unique MongoDB Atlas Connection String
const MONGODB_URI = 'mongodb+srv://sakshamshah1631_db_user:gl93d8p9W7prg3PL@cluster0.efp3ibc.mongodb.net/jsg_sports?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to Cloud Database (MongoDB)'))
  .catch((err) => console.error('❌ Database connection error:', err));

// Define the Data Schema (The structure of your registration)
const registrationSchema = new mongoose.Schema({
  fullName: String,
  age: Number,
  gender: String,
  mobile: String,
  email: String,
  city: String,
  jsgGroup: String,
  emergencyContact: String,
  medicalConditions: String,
  july12Sports: [String],
  july19Sports: [String],
  timestamp: { type: Date, default: Date.now }
});

const Registration = mongoose.model('Registration', registrationSchema);
// ---------------------------

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

let adminHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // password: 'admin123'

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100 
});
app.use(limiter);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Save to MongoDB instead of in-memory array
app.post('/api/register', async (req, res) => {
  try {
    const newEntry = new Registration(req.body);
    await newEntry.save();
    res.json({ success: true, message: 'Registration successful!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && await bcrypt.compare(password, adminHash)) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

// Fetch from MongoDB
app.get('/api/admin/registrations', async (req, res) => {
  try {
    const allRegistrations = await Registration.find().sort({ timestamp: -1 });
    res.json({ registrations: allRegistrations, total: allRegistrations.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// Export from MongoDB data
app.get('/api/admin/export', async (req, res) => {
  try {
    const registrations = await Registration.find();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');

    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'JSG Group', key: 'jsgGroup', width: 20 },
      { header: 'Emergency Contact', key: 'emergencyContact', width: 15 },
      { header: 'Medical Conditions', key: 'medicalConditions', width: 25 },
      { header: '12 July Sports', key: 'july12Sports', width: 20 },
      { header: '19 July Sports', key: 'july19Sports', width: 20 },
      { header: 'Timestamp', key: 'timestamp', width: 20 }
    ];

    registrations.forEach(reg => {
      worksheet.addRow({
        fullName: reg.fullName,
        age: reg.age,
        gender: reg.gender,
        mobile: reg.mobile,
        email: reg.email,
        city: reg.city,
        jsgGroup: reg.jsgGroup,
        emergencyContact: reg.emergencyContact,
        medicalConditions: reg.medicalConditions || 'None',
        july12Sports: Array.isArray(reg.july12Sports) ? reg.july12Sports.join(', ') : 'None',
        july19Sports: Array.isArray(reg.july19Sports) ? reg.july19Sports.join(', ') : 'None',
        timestamp: reg.timestamp ? reg.timestamp.toLocaleString() : 'N/A'
      });
    });

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=JSG_Registrations.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Export failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});