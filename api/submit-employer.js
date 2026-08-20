import nodemailer from 'nodemailer';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: false });

  return new Promise((resolve) => {
    form.parse(req, async (err, fields) => {
      if (err) {
        console.error('Formidable parsing error:', err);
        res.status(500).json({ status: 'error', message: 'Form parsing error: ' + err.message });
        return resolve();
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
        res.status(400).json({ status: 'error', message: 'Please fill in all required fields.' });
        return resolve();
      }

      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER || 'snational161@gmail.com',
            pass: process.env.SMTP_PASS || 'enobvbtimyqzhbog'
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; color: #333; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e1e4e8; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .header { background: #003366; color: #ffffff; padding: 20px; text-align: center; }
  .header h2 { margin: 0 0 5px; font-size: 22px; }
  .header p { margin: 0; font-size: 14px; opacity: 0.9; }
  .content { padding: 25px; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  th, td { padding: 12px 10px; border-bottom: 1px solid #edf2f7; text-align: left; font-size: 14px; }
  th { background-color: #f8fafc; color: #475569; width: 40%; }
  td { color: #1e293b; font-weight: 500; }
  .msg-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px; margin-top: 15px; font-size: 14px; line-height: 1.5; }
  .footer { background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #edf2f7; }
</style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h2>Employer Requirement Enquiry</h2>
      <p>Lohagarh Manpower Solutions</p>
    </div>
    <div class='content'>
      <p>A new employer requirement has been received from the website:</p>
      <table>
        <tr><th>Company Name</th><td><strong>${companyName}</strong></td></tr>
        <tr><th>Contact Person</th><td>${contactPerson}</td></tr>
        <tr><th>Mobile Number</th><td><a href='tel:${mobile}'>${mobile}</a></td></tr>
        <tr><th>Email Address</th><td><a href='mailto:${email}'>${email}</a></td></tr>
        <tr><th>Industry</th><td>${industry}</td></tr>
        <tr><th>Requirement Type</th><td>${requirementType}</td></tr>
        <tr><th>Job Position</th><td><strong>${jobPosition}</strong></td></tr>
        <tr><th>No. of Employees</th><td>${employeeCount}</td></tr>
        <tr><th>Job Location</th><td>${location}</td></tr>
        <tr><th>Salary / Budget</th><td>${salaryBudget}</td></tr>
      </table>
      
      <div class='msg-box'>
        <strong>Job Description / Details:</strong><br>
        ${jobDescription}
      </div>
    </div>
    <div class='footer'>
      Received from Vercel Live Website Application.
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

        res.status(200).json({ status: 'success', message: 'Thank you! Your enquiry has been submitted successfully.' });
        return resolve();
      } catch (sendErr) {
        console.error('Vercel Mail Error:', sendErr);
        res.status(500).json({ status: 'error', message: 'Email delivery failed: ' + sendErr.message });
        return resolve();
      }
    });
  });
}
