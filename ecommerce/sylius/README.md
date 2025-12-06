# ADSMedia + Sylius Integration

Send transactional emails from Sylius e-commerce via ADSMedia.

## Overview

Sylius is a PHP e-commerce platform built on Symfony. This integration enables:
- Order confirmation emails via ADSMedia
- Shipping notifications
- Customer account emails

## Setup

### 1. Install via Composer

```bash
composer require adsmedia/sylius-plugin
```

Or create the plugin manually:

### 2. Create ADSMedia Mailer Service

```php
<?php
// src/Mailer/ADSMediaMailer.php

namespace App\Mailer;

use Sylius\Component\Mailer\Sender\SenderInterface;

class ADSMediaMailer implements SenderInterface
{
    private string $apiKey;
    private string $fromName;

    public function __construct(string $apiKey, string $fromName)
    {
        $this->apiKey = $apiKey;
        $this->fromName = $fromName;
    }

    public function send(
        string $code,
        array $recipients,
        array $data = [],
        array $attachments = [],
        array $replyTo = []
    ): void {
        $subject = $this->getSubjectForCode($code, $data);
        $html = $this->renderTemplate($code, $data);

        foreach ($recipients as $email => $name) {
            $this->sendViaADSMedia($email, $name, $subject, $html);
        }
    }

    private function sendViaADSMedia(string $to, string $toName, string $subject, string $html): void
    {
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
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new \RuntimeException('ADSMedia API error: ' . $response);
        }
    }

    private function getSubjectForCode(string $code, array $data): string
    {
        $subjects = [
            'order_confirmation' => 'Order Confirmation #' . ($data['order']->getNumber() ?? ''),
            'shipment_confirmation' => 'Your Order Has Shipped!',
            'user_registration' => 'Welcome to Our Store!',
            'password_reset' => 'Reset Your Password',
        ];

        return $subjects[$code] ?? 'Notification';
    }

    private function renderTemplate(string $code, array $data): string
    {
        // Use Twig or return pre-built HTML
        // This is simplified - use proper template rendering in production
        
        switch ($code) {
            case 'order_confirmation':
                return $this->renderOrderConfirmation($data);
            case 'shipment_confirmation':
                return $this->renderShipmentConfirmation($data);
            case 'user_registration':
                return $this->renderWelcome($data);
            default:
                return '<p>Notification</p>';
        }
    }

    private function renderOrderConfirmation(array $data): string
    {
        $order = $data['order'];
        $items = '';
        
        foreach ($order->getItems() as $item) {
            $items .= sprintf(
                '<tr><td>%s</td><td>%d</td><td>%s</td></tr>',
                $item->getProductName(),
                $item->getQuantity(),
                $order->getCurrencyCode() . ' ' . number_format($item->getTotal() / 100, 2)
            );
        }

        return <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #4F46E5; padding: 30px; text-align: center;">
        <h1 style="color: white;">Order Confirmed! 🎉</h1>
    </div>
    <div style="padding: 30px;">
        <p>Thank you for your order <strong>#{$order->getNumber()}</strong>!</p>
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
            {$items}
        </table>
        <p style="font-size: 18px; text-align: right; margin-top: 20px;">
            <strong>Total: {$order->getCurrencyCode()} {number_format($order->getTotal() / 100, 2)}</strong>
        </p>
    </div>
</body>
</html>
HTML;
    }

    private function renderShipmentConfirmation(array $data): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #10B981; padding: 30px; text-align: center;">
        <h1 style="color: white;">Your Order Has Shipped! 📦</h1>
    </div>
    <div style="padding: 30px;">
        <p>Great news! Your order is on its way.</p>
        <p>You'll receive it soon!</p>
    </div>
</body>
</html>
HTML;
    }

    private function renderWelcome(array $data): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white;">Welcome! 🎉</h1>
    </div>
    <div style="padding: 30px;">
        <p>Thanks for creating an account with us.</p>
        <p>Start shopping and enjoy exclusive member benefits!</p>
    </div>
</body>
</html>
HTML;
    }
}
```

### 3. Configure Service

```yaml
# config/services.yaml
services:
    App\Mailer\ADSMediaMailer:
        arguments:
            $apiKey: '%env(ADSMEDIA_API_KEY)%'
            $fromName: 'Your Store'

    # Override default Sylius mailer
    sylius.email_sender:
        class: App\Mailer\ADSMediaMailer
        arguments:
            $apiKey: '%env(ADSMEDIA_API_KEY)%'
            $fromName: 'Your Store'
```

### 4. Environment Variables

```bash
# .env
ADSMEDIA_API_KEY=your_api_key_here
```

## Event Subscribers

### Order Completion Subscriber

```php
<?php
// src/EventSubscriber/OrderEmailSubscriber.php

namespace App\EventSubscriber;

use Sylius\Bundle\CoreBundle\Event\OrderEvent;
use App\Mailer\ADSMediaMailer;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class OrderEmailSubscriber implements EventSubscriberInterface
{
    private ADSMediaMailer $mailer;

    public function __construct(ADSMediaMailer $mailer)
    {
        $this->mailer = $mailer;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            'sylius.order.post_complete' => 'onOrderComplete',
        ];
    }

    public function onOrderComplete(OrderEvent $event): void
    {
        $order = $event->getOrder();
        $customer = $order->getCustomer();

        $this->mailer->send(
            'order_confirmation',
            [$customer->getEmail() => $customer->getFullName()],
            ['order' => $order]
        );
    }
}
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Sylius](https://sylius.com)
- [Sylius Documentation](https://docs.sylius.com)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

