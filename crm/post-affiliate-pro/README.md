# ADSMedia + Post Affiliate Pro Integration

Send affiliate emails via ADSMedia from Post Affiliate Pro.

## Overview

Post Affiliate Pro is an affiliate tracking platform. This integration enables:
- Welcome emails for new affiliates
- Commission notifications
- Promotional campaigns

## Setup

### 1. Post Affiliate Pro Plugin

Create a plugin to intercept email sending:

```php
<?php
// PostAffiliatePro/plugins/ADSMediaEmail/Main.class.php

class ADSMediaEmail extends Gpf_Plugins_Handler {
    
    private $apiKey;
    private $fromName;
    
    public function __construct() {
        $this->apiKey = Gpf_Settings::get('ADSMediaEmail_ApiKey');
        $this->fromName = Gpf_Settings::get('ADSMediaEmail_FromName');
    }
    
    public function initSettings(Gpf_Plugins_Definition $pluginDefinition) {
        $pluginDefinition->addSetting('ADSMediaEmail_ApiKey', 'API Key');
        $pluginDefinition->addSetting('ADSMediaEmail_FromName', 'From Name', 'Your Company');
    }
    
    protected function sendViaADSMedia($to, $toName, $subject, $html) {
        $ch = curl_init('https://api.adsmedia.live/v1/send');
        
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'to' => $to,
                'to_name' => $toName,
                'subject' => $subject,
                'html' => $html,
                'from_name' => $this->fromName,
            ]),
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
    
    public function onAffiliateSignup(Gpf_Plugins_ActionData $data) {
        $affiliate = $data->get('user');
        
        $this->sendViaADSMedia(
            $affiliate->getEmail(),
            $affiliate->getFirstName() . ' ' . $affiliate->getLastName(),
            'Welcome to Our Affiliate Program!',
            $this->getWelcomeEmailHtml($affiliate)
        );
    }
    
    public function onCommissionApproved(Gpf_Plugins_ActionData $data) {
        $commission = $data->get('commission');
        $affiliate = $commission->getUser();
        
        $this->sendViaADSMedia(
            $affiliate->getEmail(),
            $affiliate->getFirstName(),
            'Commission Approved! 🎉',
            $this->getCommissionEmailHtml($commission)
        );
    }
    
    public function onPayoutCreated(Gpf_Plugins_ActionData $data) {
        $payout = $data->get('payout');
        $affiliate = $payout->getUser();
        
        $this->sendViaADSMedia(
            $affiliate->getEmail(),
            $affiliate->getFirstName(),
            'Payment Sent!',
            $this->getPayoutEmailHtml($payout)
        );
    }
    
    private function getWelcomeEmailHtml($affiliate) {
        $name = $affiliate->getFirstName();
        $refLink = $affiliate->getRefLink();
        
        return <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to the Team! 🎉</h1>
    </div>
    
    <div style="padding: 30px;">
        <p>Hi {$name},</p>
        <p>Congratulations! Your affiliate account has been approved.</p>
        
        <h2>Your Affiliate Link</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; word-break: break-all;">
            <code>{$refLink}</code>
        </div>
        
        <h2>Getting Started</h2>
        <ol>
            <li>Share your unique link with your audience</li>
            <li>Earn commission on every sale</li>
            <li>Track your earnings in the dashboard</li>
        </ol>
        
        <p style="text-align: center; margin-top: 30px;">
            <a href="{{dashboard_url}}" style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">Go to Dashboard</a>
        </p>
    </div>
</body>
</html>
HTML;
    }
    
    private function getCommissionEmailHtml($commission) {
        $amount = $commission->getCommission();
        $currency = Gpf_Settings::get('Aff_currency');
        
        return <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #4F46E5; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Commission Approved! 💰</h1>
    </div>
    
    <div style="padding: 30px; text-align: center;">
        <p style="font-size: 48px; margin: 20px 0; color: #10B981;">
            +{$currency} {$amount}
        </p>
        <p>Your commission has been approved and will be included in your next payout.</p>
        
        <p style="margin-top: 30px;">
            <a href="{{dashboard_url}}" style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">View Dashboard</a>
        </p>
    </div>
</body>
</html>
HTML;
    }
    
    private function getPayoutEmailHtml($payout) {
        $amount = $payout->getAmount();
        $currency = Gpf_Settings::get('Aff_currency');
        $method = $payout->getPayoutMethod();
        
        return <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #10B981; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Payment Sent! 🎉</h1>
    </div>
    
    <div style="padding: 30px;">
        <p>Great news! Your payment has been processed.</p>
        
        <table style="width: 100%; margin: 20px 0;">
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">{$currency} {$amount}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Method:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">{$method}</td>
            </tr>
        </table>
        
        <p>The payment should arrive within 1-3 business days depending on your payment method.</p>
        <p>Thank you for being a valued affiliate partner!</p>
    </div>
</body>
</html>
HTML;
    }
}
```

### 2. Register Plugin

```php
<?php
// PostAffiliatePro/plugins/ADSMediaEmail/Definition.class.php

class ADSMediaEmail_Definition extends Gpf_Plugins_Definition {
    public function __construct() {
        $this->codeName = 'ADSMediaEmail';
        $this->name = 'ADSMedia Email';
        $this->description = 'Send emails via ADSMedia API';
        $this->version = '1.0.0';
        
        $this->addImplementation(
            'PostAffiliate_Signup_Handler',
            'ADSMediaEmail_Main',
            'onAffiliateSignup'
        );
        
        $this->addImplementation(
            'Pap_Common_Commission_Handler',
            'ADSMediaEmail_Main',
            'onCommissionApproved'
        );
        
        $this->addImplementation(
            'Pap_Merchants_Payout_Handler',
            'ADSMediaEmail_Main',
            'onPayoutCreated'
        );
    }
}
```

### 3. Webhook Alternative

```php
<?php
// webhook-handler.php

$payload = json_decode(file_get_contents('php://input'), true);
$apiKey = getenv('ADSMEDIA_API_KEY');

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
            'from_name' => 'Affiliate Program',
        ]),
    ]);
    
    return curl_exec($ch);
}

switch ($payload['event']) {
    case 'affiliate.signup':
        sendEmail(
            $payload['affiliate']['email'],
            $payload['affiliate']['name'],
            'Welcome to Our Affiliate Program!',
            '<h1>Welcome!</h1><p>Start earning today...</p>'
        );
        break;
        
    case 'commission.approved':
        sendEmail(
            $payload['affiliate']['email'],
            $payload['affiliate']['name'],
            'Commission Approved!',
            '<h1>+$' . $payload['commission']['amount'] . '</h1>'
        );
        break;
}

echo json_encode(['status' => 'ok']);
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Post Affiliate Pro](https://www.postaffiliatepro.com)
- [PAP API](https://support.qualityunit.com/api/)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

