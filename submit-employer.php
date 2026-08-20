<?php
header('Content-Type: application/json; charset=utf-8');

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/smtp_mailer.php';

// Client Credentials & Recipient Email
$smtp_user = SMTP_USER;
$smtp_pass = SMTP_PASS;
$to_email  = TO_EMAIL;
$company_name = COMPANY_NAME;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid request method.'
    ]);
    exit;
}

// Sanitize inputs
$companyName = isset($_POST['companyName']) ? htmlspecialchars(trim($_POST['companyName'])) : '';
$contactPerson = isset($_POST['contactPerson']) ? htmlspecialchars(trim($_POST['contactPerson'])) : '';
$mobile = isset($_POST['mobile']) ? htmlspecialchars(trim($_POST['mobile'])) : '';
$email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$industry = isset($_POST['industry']) ? htmlspecialchars(trim($_POST['industry'])) : 'Not specified';
$requirementType = isset($_POST['requirementType']) ? htmlspecialchars(trim($_POST['requirementType'])) : 'Not specified';
$jobPosition = isset($_POST['jobPosition']) ? htmlspecialchars(trim($_POST['jobPosition'])) : 'Not specified';
$employeeCount = isset($_POST['employeeCount']) ? htmlspecialchars(trim($_POST['employeeCount'])) : (isset($_POST['numberOfPositions']) ? htmlspecialchars(trim($_POST['numberOfPositions'])) : 'Not specified');
$location = isset($_POST['location']) ? htmlspecialchars(trim($_POST['location'])) : (isset($_POST['jobLocation']) ? htmlspecialchars(trim($_POST['jobLocation'])) : 'Not specified');
$salaryBudget = isset($_POST['salaryBudget']) ? htmlspecialchars(trim($_POST['salaryBudget'])) : 'Not specified';
$jobDescription = isset($_POST['jobDescription']) ? nl2br(htmlspecialchars(trim($_POST['jobDescription']))) : (isset($_POST['message']) ? nl2br(htmlspecialchars(trim($_POST['message']))) : 'No specific message');

// Validate required fields
if (empty($companyName) || empty($contactPerson) || empty($mobile) || empty($email) || empty($jobPosition)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Please fill in all required fields marked with *.'
    ]);
    exit;
}

$subject = "New Employer Requirement: " . $companyName . " (" . $jobPosition . ")";

$html_body = "
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
        <tr><th>Company Name</th><td><strong>{$companyName}</strong></td></tr>
        <tr><th>Contact Person</th><td>{$contactPerson}</td></tr>
        <tr><th>Mobile Number</th><td><a href='tel:{$mobile}'>{$mobile}</a></td></tr>
        <tr><th>Email Address</th><td><a href='mailto:{$email}'>{$email}</a></td></tr>
        <tr><th>Industry</th><td>{$industry}</td></tr>
        <tr><th>Requirement Type</th><td>{$requirementType}</td></tr>
        <tr><th>Job Position</th><td><strong>{$jobPosition}</strong></td></tr>
        <tr><th>No. of Employees</th><td>{$employeeCount}</td></tr>
        <tr><th>Job Location</th><td>{$location}</td></tr>
        <tr><th>Salary / Budget</th><td>{$salaryBudget}</td></tr>
      </table>
      
      <div class='msg-box'>
        <strong>Job Description / Details:</strong><br>
        {$jobDescription}
      </div>
    </div>
    <div class='footer'>
      Received on " . date('d M Y, h:i A') . " from website employer enquiry form.
    </div>
  </div>
</body>
</html>";

$mailer = new SimpleSMTPMailer(
    'smtp.gmail.com',
    587,
    $smtp_user,
    $smtp_pass,
    $smtp_user,
    $company_name
);

$sent = $mailer->send($to_email, $subject, $html_body);

if ($sent) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Thank you! Your enquiry has been submitted successfully.'
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to send email: ' . $mailer->error
    ]);
}
