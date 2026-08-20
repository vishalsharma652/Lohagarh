<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/phpmailer/Exception.php';
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';

class SimpleSMTPMailer {
    private $host;
    private $port;
    private $user;
    private $pass;
    private $from_email;
    private $from_name;
    public $error = '';

    public function __construct($host = 'smtp.gmail.com', $port = 587, $user = '', $pass = '', $from_email = '', $from_name = '') {
        $this->host = $host;
        $this->port = $port;
        $this->user = $user;
        $this->pass = $pass;
        $this->from_email = !empty($from_email) ? $from_email : $user;
        $this->from_name = !empty($from_name) ? $from_name : 'Lohagarh Manpower Solutions';
    }

    public function send($to, $subject, $html_body, $attachments = []) {
        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host       = $this->host;
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->user;
            $mail->Password   = $this->pass;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $this->port;
            $mail->CharSet    = 'UTF-8';

            // Allow self-signed / bypass local SSL cert validation issues
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );

            $mail->setFrom($this->from_email, $this->from_name);
            $mail->addAddress($to);

            foreach ($attachments as $att) {
                if (isset($att['path']) && file_exists($att['path'])) {
                    $filename = isset($att['name']) ? $att['name'] : basename($att['path']);
                    $mail->addAttachment($att['path'], $filename);
                }
            }

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $html_body;

            $mail->send();
            return true;
        } catch (Exception $e) {
            $this->error = $mail->ErrorInfo;
            return false;
        }
    }
}
