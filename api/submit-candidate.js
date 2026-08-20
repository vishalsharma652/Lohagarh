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

  const form = formidable({ multiples: false, keepExtensions: true });

  return new Promise((resolve) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Formidable parsing error:', err);
        res.status(500).json({ status: 'error', message: 'Form parsing error: ' + err.message });
        return resolve();
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
        res.status(400).json({ status: 'error', message: 'Please fill in all required fields.' });
        return resolve();
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
  .footer { background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #edf2f7; }
</style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h2>New Candidate Registration</h2>
      <p>Lohagarh Manpower Solutions</p>
    </div>
    <div class='content'>
      <p>A new candidate has submitted their resume details through the website:</p>
      <table>
        <tr><th>Full Name</th><td>${name}</td></tr>
        <tr><th>Applying For</th><td><strong>${applyingFor}</strong></td></tr>
        <tr><th>Mobile Number</th><td><a href='tel:${mobile}'>${mobile}</a></td></tr>
        <tr><th>Email Address</th><td><a href='mailto:${email}'>${email}</a></td></tr>
        <tr><th>Qualification</th><td>${qualification}</td></tr>
        <tr><th>Total Experience</th><td>${experience}</td></tr>
        <tr><th>Current Location</th><td>${currentLocation}</td></tr>
        <tr><th>Preferred Location</th><td>${preferredLocation}</td></tr>
        <tr><th>Current Salary</th><td>${currentSalary}</td></tr>
        <tr><th>Expected Salary</th><td>${expectedSalary}</td></tr>
      </table>
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
          replyTo: `${name} <${email}>`,
          subject: `New Resume Application: ${name} - ${applyingFor}`,
          html: htmlContent,
          attachments: attachments
        });

        res.status(200).json({ status: 'success', message: 'Thank you! Your resume and details have been submitted successfully.' });
        return resolve();
      } catch (sendErr) {
        console.error('Vercel Mail Error:', sendErr);
        res.status(500).json({ status: 'error', message: 'Email delivery failed: ' + sendErr.message });
        return resolve();
      }
    });
  });
}
