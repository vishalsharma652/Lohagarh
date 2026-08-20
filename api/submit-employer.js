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

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields) => {
    if (err) {
      console.error('Parsing error:', err);
      return res.status(500).json({ status: 'error', message: 'Form parsing error: ' + err.message });
    }

    const getVal = (field) => Array.isArray(field) ? field[0] : (field || '');

    const companyName = getVal(fields.companyName);
    const contactPerson = getVal(fields.contactPerson);
    const mobile = getVal(fields.mobile);
    const email = getVal(fields.email);
    const industry = getVal(fields.industry) || 'Not specified';
    const requirementType = getVal(fields.requirementType) || 'Not specified';
    const jobPosition = getVal(fields.jobPosition) || 'Not specified';
    const employeeCount = getVal(fields.employeeCount) || getVal(fields.numberOfPositions) || 'Not specified';
    const location = getVal(fields.location) || getVal(fields.jobLocation) || 'Not specified';
    const salaryBudget = getVal(fields.salaryBudget) || 'Not specified';
    const jobDescription = getVal(fields.jobDescription) || getVal(fields.message) || 'No specific message';

    if (!companyName || !contactPerson || !mobile || !email || !jobPosition) {
      return res.status(400).json({ status: 'error', message: 'Please fill in all required fields.' });
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
      <h2>Employer Requirement Enquiry</h2>
      <p>Lohagarh Manpower Solutions</p>
    </div>
    <div class="content">
      <p>A new employer requirement has been received from the website:</p>
      <table>
        <tr><th>Company Name</th><td><strong>${companyName}</strong></td></tr>
        <tr><th>Contact Person</th><td>${contactPerson}</td></tr>
        <tr><th>Mobile Number</th><td><a href="tel:${mobile}">${mobile}</a></td></tr>
        <tr><th>Email Address</th><td><a href="mailto:${email}">${email}</a></td></tr>
        <tr><th>Industry</th><td>${industry}</td></tr>
        <tr><th>Requirement Type</th><td>${requirementType}</td></tr>
        <tr><th>Job Position</th><td><strong>${jobPosition}</strong></td></tr>
        <tr><th>No. of Employees</th><td>${employeeCount}</td></tr>
        <tr><th>Job Location</th><td>${location}</td></tr>
        <tr><th>Salary / Budget</th><td>${salaryBudget}</td></tr>
      </table>
      <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px; margin-top: 15px;">
        <strong>Details:</strong><br>${jobDescription}
      </div>
    </div>
  </div>
</body>
</html>`;

      await transporter.sendMail({
        from: '"Lohagarh Manpower Solutions" <snational161@gmail.com>',
        to: process.env.TO_EMAIL || 'snational161@gmail.com',
        replyTo: `${contactPerson} <${email}>`,
        subject: `New Employer Requirement: ${companyName} - ${jobPosition}`,
        html: htmlContent
      });

      return res.status(200).json({ status: 'success', message: 'Thank you! Your enquiry has been submitted successfully.' });
    } catch (sendErr) {
      console.error('Vercel Mail Error:', sendErr);
      return res.status(500).json({ status: 'error', message: 'Email delivery failed: ' + sendErr.message });
    }
  });
};
