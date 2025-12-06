# ADSMedia + Invoice Ninja Integration

Send invoice emails via ADSMedia from Invoice Ninja.

## Overview

Invoice Ninja is an open-source invoicing platform. This integration enables:
- Send invoices via ADSMedia
- Payment reminders
- Receipt notifications

## Setup

### 1. Invoice Ninja Webhook

Configure webhooks in Invoice Ninja to trigger ADSMedia emails:

```php
<?php
// webhook-handler.php

$apiKey = getenv('ADSMEDIA_API_KEY');
$payload = json_decode(file_get_contents('php://input'), true);

function sendEmail($to, $toName, $subject, $html) {
    global $apiKey;
    
    $ch = curl_init('https://api.adsmedia.live/v1/send');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'to' => $to,
            'to_name' => $toName,
            'subject' => $subject,
            'html' => $html,
            'from_name' => 'Billing',
        ]),
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

$event = $payload['event_type'] ?? '';
$data = $payload['data'] ?? [];

switch ($event) {
    case 'invoice.sent':
        $invoice = $data;
        $client = $invoice['client'];
        
        sendEmail(
            $client['email'],
            $client['name'],
            "Invoice #{$invoice['number']} from Your Company",
            "
            <h1>Invoice #{$invoice['number']}</h1>
            <p>Hi {$client['name']},</p>
            <p>Please find your invoice attached.</p>
            <table style='width: 100%; border-collapse: collapse;'>
                <tr style='background: #f5f5f5;'>
                    <td style='padding: 10px;'><strong>Amount Due:</strong></td>
                    <td style='padding: 10px; text-align: right;'>{$invoice['balance']} {$invoice['currency']}</td>
                </tr>
                <tr>
                    <td style='padding: 10px;'><strong>Due Date:</strong></td>
                    <td style='padding: 10px; text-align: right;'>{$invoice['due_date']}</td>
                </tr>
            </table>
            <p style='text-align: center; margin-top: 30px;'>
                <a href='{$invoice['invitations'][0]['link']}' style='background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;'>View & Pay Invoice</a>
            </p>
            "
        );
        break;
        
    case 'payment.completed':
        $payment = $data;
        $client = $payment['client'];
        
        sendEmail(
            $client['email'],
            $client['name'],
            "Payment Received - Thank You!",
            "
            <h1>Payment Confirmed! ✓</h1>
            <p>Hi {$client['name']},</p>
            <p>We've received your payment of <strong>{$payment['amount']} {$payment['currency']}</strong>.</p>
            <p>Transaction ID: {$payment['transaction_reference']}</p>
            <p>Thank you for your business!</p>
            "
        );
        break;
        
    case 'invoice.reminder':
        $invoice = $data;
        $client = $invoice['client'];
        
        sendEmail(
            $client['email'],
            $client['name'],
            "Reminder: Invoice #{$invoice['number']} Due Soon",
            "
            <h1>Payment Reminder</h1>
            <p>Hi {$client['name']},</p>
            <p>This is a friendly reminder that Invoice #{$invoice['number']} is due on {$invoice['due_date']}.</p>
            <p><strong>Amount Due: {$invoice['balance']} {$invoice['currency']}</strong></p>
            <p style='text-align: center; margin-top: 30px;'>
                <a href='{$invoice['invitations'][0]['link']}' style='background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;'>Pay Now</a>
            </p>
            "
        );
        break;
}

http_response_code(200);
echo json_encode(['status' => 'ok']);
```

### 2. Configure Webhook in Invoice Ninja

1. Go to **Settings** → **Workflow Settings** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/webhook-handler.php`
3. Select events: `invoice.sent`, `payment.completed`, `invoice.reminder`

### 3. Custom Email Templates

```php
<?php
// templates/invoice-email.php

function getInvoiceEmailHtml($invoice, $client) {
    $items = '';
    foreach ($invoice['line_items'] as $item) {
        $items .= "
        <tr>
            <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$item['product_key']}</td>
            <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$item['notes']}</td>
            <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: center;'>{$item['quantity']}</td>
            <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>{$item['cost']}</td>
        </tr>";
    }

    return <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1F2937; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Invoice #{$invoice['number']}</h1>
    </div>
    
    <div style="padding: 30px;">
        <p>Hi {$client['name']},</p>
        <p>Please find your invoice details below.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: left;">Description</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
            {$items}
        </table>
        
        <div style="text-align: right; margin: 20px 0;">
            <p>Subtotal: {$invoice['amount']} {$invoice['currency']}</p>
            <p style="font-size: 18px;"><strong>Total Due: {$invoice['balance']} {$invoice['currency']}</strong></p>
            <p>Due Date: {$invoice['due_date']}</p>
        </div>
        
        <p style="text-align: center; margin-top: 30px;">
            <a href="{$invoice['invitations'][0]['link']}" style="background: #4F46E5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 4px; font-size: 16px;">Pay Now</a>
        </p>
    </div>
    
    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>Your Company Name</p>
        <p>123 Business Street, City, Country</p>
    </div>
</body>
</html>
HTML;
}
```

## API Integration

### Send Invoice Directly

```php
<?php
// Send invoice email via ADSMedia API

$invoiceId = 'INV-001';
$invoice = getInvoiceFromNinja($invoiceId); // Your function to get invoice

$result = sendEmail(
    $invoice['client']['email'],
    $invoice['client']['name'],
    "Invoice #{$invoice['number']}",
    getInvoiceEmailHtml($invoice, $invoice['client'])
);

if ($result['success']) {
    echo "Email sent! ID: " . $result['data']['message_id'];
}
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Invoice Ninja](https://invoiceninja.com)
- [Invoice Ninja API](https://api-docs.invoicing.co)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

