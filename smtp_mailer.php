<?php
/**
 * Standalone Zero-Dependency SMTP Mailer with Attachment Support
 */
class SimpleSMTPMailer {
    private $host;
    private $port;
    private $user;
    private $pass;
    private $from_email;
    private $from_name;
    private $socket = null;
    public $error = '';

    public function __construct($host = 'smtp.gmail.com', $port = 465, $user = '', $pass = '', $from_email = '', $from_name = '') {
        $this->host = $host;
        $this->port = $port;
        $this->user = $user;
        $this->pass = $pass;
        $this->from_email = !empty($from_email) ? $from_email : $user;
        $this->from_name = !empty($from_name) ? $from_name : 'Website';
    }

    private function getResponse() {
        $response = '';
        while ($str = fgets($this->socket, 515)) {
            $response .= $str;
            if (substr($str, 3, 1) == " ") {
                break;
            }
        }
        return $response;
    }

    private function sendCommand($cmd) {
        fputs($this->socket, $cmd . "\r\n");
        return $this->getResponse();
    }

    public function send($to, $subject, $html_body, $attachments = []) {
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);

        $transport = ($this->port == 465) ? 'ssl://' : 'tcp://';
        $this->socket = @stream_socket_client(
            $transport . $this->host . ':' . $this->port,
            $errno,
            $errstr,
            15,
            STREAM_CLIENT_CONNECT,
            $context
        );

        if (!$this->socket) {
            $this->error = "Connection failed: $errstr ($errno)";
            return false;
        }

        $this->getResponse();

        $this->sendCommand("EHLO " . gethostname());

        if ($this->port == 587) {
            $this->sendCommand("STARTTLS");
            stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            $this->sendCommand("EHLO " . gethostname());
        }

        $authRes = $this->sendCommand("AUTH LOGIN");
        $userRes = $this->sendCommand(base64_encode($this->user));
        $passRes = $this->sendCommand(base64_encode($this->pass));

        if (strpos($passRes, '235') === false && strpos($passRes, 'accepted') === false) {
            $this->error = "Authentication failed. Response: " . trim($passRes);
            fclose($this->socket);
            return false;
        }

        $this->sendCommand("MAIL FROM: <" . $this->from_email . ">");
        $this->sendCommand("RCPT TO: <" . $to . ">");
        $this->sendCommand("DATA");

        $boundary = "----=_NextPart_" . md5(time());

        $headers = [];
        $headers[] = "From: =?UTF-8?B?" . base64_encode($this->from_name) . "?= <" . $this->from_email . ">";
        $headers[] = "To: <" . $to . ">";
        $headers[] = "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=";
        $headers[] = "MIME-Version: 1.0";
        $headers[] = "Content-Type: multipart/mixed; boundary=\"{$boundary}\"";
        $headers[] = "X-Mailer: PHP/" . phpversion();

        $message = implode("\r\n", $headers) . "\r\n\r\n";

        // HTML Body Part
        $message .= "--{$boundary}\r\n";
        $message .= "Content-Type: text/html; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $message .= chunk_split(base64_encode($html_body)) . "\r\n";

        // Attachment Parts
        foreach ($attachments as $att) {
            if (isset($att['path']) && file_exists($att['path'])) {
                $filename = isset($att['name']) ? $att['name'] : basename($att['path']);
                $content = file_get_contents($att['path']);
                
                $message .= "--{$boundary}\r\n";
                $message .= "Content-Type: application/octet-stream; name=\"{$filename}\"\r\n";
                $message .= "Content-Disposition: attachment; filename=\"{$filename}\"\r\n";
                $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
                $message .= chunk_split(base64_encode($content)) . "\r\n";
            }
        }

        $message .= "--{$boundary}--\r\n";
        $message .= "\r\n.\r\n";

        fputs($this->socket, $message);
        $dataRes = $this->getResponse();

        $this->sendCommand("QUIT");
        fclose($this->socket);

        if (strpos($dataRes, '250') !== false || strpos($dataRes, 'OK') !== false) {
            return true;
        }

        $this->error = "Failed to deliver message. Response: " . trim($dataRes);
        return false;
    }
}
