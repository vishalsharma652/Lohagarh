const nodemailer = require('nodemailer');
const formidable = require('formidable');

export const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Parsing error:', err);
      return res.status(500).json({ status: 'error', message: 'Form parsing error: ' + err.message });
    }

    const getVal = (field) => Array.isArray(field) ? field[0] : (field || '');

    const name = getVal(fields.name);
    const mobile = getVal(fields.mobile);
    const email = getVal(fields.email);
    const qualification = getVal(fields.qualification);
    const experience = getVal(fields.experience) || 'Not specified';
    const currentLocation = getVal(fields.currentLocation) || 'Not specified';
    const preferredLocation = getVal(fields.preferredLocation) || 'Not specified';
    const currentSalary = getVal(fields.currentSalary) || 'Not specified';
    const expectedSalary = getVal(fields.expectedSalary) || 'Not specified';
    const applyingFor = getVal(fields.applyingFor) || 'Not specified';

    if (!name || !mobile || !email || !qualification || !applyingFor) {
      return res.status(400).json({ status: 'error', message: 'Please fill in all required fields.' });
    }

    let attachments = [];
    const fileObj = files.resume ? (Array.isArray(files.resume) ? files.resume[0] : files.resume) : null;

    if (fileObj && fileObj.filepath) {
      attachments.push({
        filename: fileObj.originalFilename || 'Resume.pdf',
        path: fileObj.filepath
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER || 'snational161@gmail.com',
          pass: process.env.SMTP_PASS || 'enobvbtimyqzhbog'
        }
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; color: #333; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e1e4e8; padding: 20px; }
  .header { background: #003366; color: #ffffff; padding: 15px; text-align: center; border-radius: 6px 6px 0 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  th, td { padding: 10px; border-bottom: 1px solid #edf2f7; text-align: left; font-size: 14px; }
  th { background-color: #f8fafc; color: #475569; width: 40%; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Candidate Registration</h2>
      <p>Lohagarh Manpower Solutions</p>
    </div>
    <div class="content">
      <p>A new candidate has submitted their resume details through the website:</p>
      <table>
        <tr><th>Full Name</th><td>${name}</td></tr>
        <tr><th>Applying For</th><td><strong>${applyingFor}</strong></td></tr>
        <tr><th>Mobile Number</th><td><a href="tel:${mobile}">${mobile}</a></td></tr>
        <tr><th>Email Address</th><td><a href="mailto:${email}">${email}</a></td></tr>
        <tr><th>Qualification</th><td>${qualification}</td></tr>
        <tr><th>Total Experience</th><td>${experience}</td></tr>
        <tr><th>Current Location</th><td>${currentLocation}</td></tr>
        <tr><th>Preferred Location</th><td>${preferredLocation}</td></tr>
        <tr><th>Current Salary</th><td>${currentSalary}</td></tr>
        <tr><th>Expected Salary</th><td>${expectedSalary}</td></tr>
      </table>
    </div>
  </div>
</body>
</html>`;

      await transporter.sendMail({
        from: '"Lohagarh Manpower Solutions" <snational161@gmail.com>',
        to: process.env.TO_EMAIL || 'snational161@gmail.com',
        replyTo: `${name} <${email}>`,
        subject: `New Resume Application: ${name} - ${applyingFor}`,
        html: htmlContent,
        attachments: attachments
      });

      return res.status(200).json({ status: 'success', message: 'Thank you! Your resume and details have been submitted successfully.' });
    } catch (sendErr) {
      console.error('Vercel Mail Error:', sendErr);
      return res.status(500).json({ status: 'error', message: 'Email delivery failed: ' + sendErr.message });
    }
  });
};
