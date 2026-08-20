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

// Sanitize input fields
$name = isset($_POST['name']) ? htmlspecialchars(trim($_POST['name'])) : '';
$mobile = isset($_POST['mobile']) ? htmlspecialchars(trim($_POST['mobile'])) : '';
$email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$qualification = isset($_POST['qualification']) ? htmlspecialchars(trim($_POST['qualification'])) : '';
$experience = isset($_POST['experience']) ? htmlspecialchars(trim($_POST['experience'])) : 'Not specified';
$currentLocation = isset($_POST['currentLocation']) ? htmlspecialchars(trim($_POST['currentLocation'])) : 'Not specified';
$preferredLocation = isset($_POST['preferredLocation']) ? htmlspecialchars(trim($_POST['preferredLocation'])) : 'Not specified';
$currentSalary = isset($_POST['currentSalary']) ? htmlspecialchars(trim($_POST['currentSalary'])) : 'Not specified';
$expectedSalary = isset($_POST['expectedSalary']) ? htmlspecialchars(trim($_POST['expectedSalary'])) : 'Not specified';
$applyingFor = isset($_POST['applyingFor']) ? htmlspecialchars(trim($_POST['applyingFor'])) : 'Not specified';

// Validate required text fields
if (empty($name) || empty($mobile) || empty($email) || empty($qualification) || empty($applyingFor)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Please fill in all required fields marked with *.'
    ]);
    exit;
}

// Ensure Upload Directory Exists
$upload_dir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'resumes' . DIRECTORY_SEPARATOR;
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

$uploaded_file_path = null;
$original_filename = null;

// Handle Resume File Upload
if (!isset($_FILES['resume']) || $_FILES['resume']['error'] === UPLOAD_ERR_NO_FILE) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Please select and attach your Resume file (.pdf, .doc, or .docx).'
    ]);
    exit;
}

if ($_FILES['resume']['error'] !== UPLOAD_ERR_OK) {
    $err_code = $_FILES['resume']['error'];
    $err_msg = 'File upload failed with error code: ' . $err_code;
    if ($err_code === UPLOAD_ERR_INI_SIZE || $err_code === UPLOAD_ERR_FORM_SIZE) {
        $err_msg = 'The uploaded file is too large. Maximum allowed size is 10 MB.';
    }
    echo json_encode([
        'status' => 'error',
        'message' => $err_msg
    ]);
    exit;
}

$file_tmp = $_FILES['resume']['tmp_name'];
$original_filename = basename($_FILES['resume']['name']);
$file_size = $_FILES['resume']['size'];
$file_ext = strtolower(pathinfo($original_filename, PATHINFO_EXTENSION));

$allowed_extensions = ['pdf', 'doc', 'docx'];
$max_size = 10 * 1024 * 1024; // 10 MB

if (!in_array($file_ext, $allowed_extensions)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid file format. Only PDF, DOC, and DOCX files are allowed.'
    ]);
    exit;
}

if ($file_size > $max_size) {
    echo json_encode([
        'status' => 'error',
        'message' => 'File size exceeds the 10 MB limit. Please choose a smaller file.'
    ]);
    exit;
}

// Generate clean unique filename
$safe_name = preg_replace('/[^a-zA-Z0-9_-]/', '_', $name);
$new_filename = 'Resume_' . $safe_name . '_' . date('Ymd_His') . '.' . $file_ext;
$target_destination = $upload_dir . $new_filename;

if (!move_uploaded_file($file_tmp, $target_destination)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to save the resume file to the server. Please check folder permissions.'
    ]);
    exit;
}

$uploaded_file_path = $target_destination;

// Prepare Email Subject & Body
$subject = "New Resume Application: " . $name . " - " . $applyingFor;

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
  th { background-color: #f8fafc; color: #475569; width: 38%; }
  td { color: #1e293b; font-weight: 500; }
  .attachment-notice { background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; margin-top: 20px; font-size: 14px; color: #1e40af; }
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
        <tr><th>Full Name</th><td>{$name}</td></tr>
        <tr><th>Applying For</th><td><strong>{$applyingFor}</strong></td></tr>
        <tr><th>Mobile Number</th><td><a href='tel:{$mobile}'>{$mobile}</a></td></tr>
        <tr><th>Email Address</th><td><a href='mailto:{$email}'>{$email}</a></td></tr>
        <tr><th>Qualification</th><td>{$qualification}</td></tr>
        <tr><th>Total Experience</th><td>{$experience}</td></tr>
        <tr><th>Current Location</th><td>{$currentLocation}</td></tr>
        <tr><th>Preferred Location</th><td>{$preferredLocation}</td></tr>
        <tr><th>Current Salary</th><td>{$currentSalary}</td></tr>
        <tr><th>Expected Salary</th><td>{$expectedSalary}</td></tr>
      </table>
      
      <div class='attachment-notice'>
        📎 <strong>Resume Attached:</strong> {$original_filename}<br>
        (The resume file is also saved on server: <code>uploads/resumes/{$new_filename}</code>)
      </div>
    </div>
    <div class='footer'>
      Received on " . date('d M Y, h:i A') . " from website candidate registration form.
    </div>
  </div>
</body>
</html>";

// Send Email via Client Gmail SMTP
$mailer = new SimpleSMTPMailer(
    'smtp.gmail.com',
    587,
    $smtp_user,
    $smtp_pass,
    $smtp_user,
    $company_name
);

$attachments = [];
if ($uploaded_file_path && file_exists($uploaded_file_path)) {
    $attachments[] = [
        'path' => $uploaded_file_path,
        'name' => $original_filename
    ];
}

$sent = $mailer->send($to_email, $subject, $html_body, $attachments);

if ($sent) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Thank you! Your resume and details have been submitted successfully.',
        'saved_file' => $new_filename
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to send email: ' . $mailer->error
    ]);
}
