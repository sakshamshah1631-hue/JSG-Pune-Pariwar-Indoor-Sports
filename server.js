// Export Data to Excel Sheet
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

    // Response headers
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