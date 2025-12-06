# ADSMedia + Vendure Integration

Send transactional emails from Vendure e-commerce via ADSMedia.

## Overview

Vendure is a headless commerce framework built with TypeScript. This integration provides:
- Custom EmailSender for ADSMedia
- Order lifecycle emails
- Customer notifications

## Setup

### 1. Install Dependencies

```bash
npm install node-fetch
```

### 2. Create ADSMedia Email Sender

```typescript
// src/plugins/adsmedia/adsmedia-email-sender.ts
import { EmailSender, EmailDetails } from '@vendure/email-plugin';
import fetch from 'node-fetch';

export interface ADSMediaConfig {
  apiKey: string;
  fromName: string;
}

export class ADSMediaEmailSender implements EmailSender {
  private apiKey: string;
  private fromName: string;

  constructor(config: ADSMediaConfig) {
    this.apiKey = config.apiKey;
    this.fromName = config.fromName;
  }

  async send(email: EmailDetails): Promise<void> {
    const response = await fetch('https://api.adsmedia.live/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email.recipient,
        to_name: email.recipient.split('@')[0],
        subject: email.subject,
        html: email.body,
        from_name: this.fromName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ADSMedia Error: ${error.error?.message || 'Unknown error'}`);
    }
  }
}
```

### 3. Configure Vendure

```typescript
// vendure-config.ts
import { VendureConfig } from '@vendure/core';
import { EmailPlugin, defaultEmailHandlers } from '@vendure/email-plugin';
import { ADSMediaEmailSender } from './plugins/adsmedia/adsmedia-email-sender';

export const config: VendureConfig = {
  plugins: [
    EmailPlugin.init({
      devMode: false,
      outputPath: path.join(__dirname, '../static/email/test-emails'),
      route: 'mailbox',
      handlers: defaultEmailHandlers,
      templatePath: path.join(__dirname, '../static/email/templates'),
      globalTemplateVars: {
        fromAddress: '"Your Store" <noreply@yourstore.com>',
        verifyEmailAddressUrl: 'https://yourstore.com/verify',
        passwordResetUrl: 'https://yourstore.com/reset-password',
        changeEmailAddressUrl: 'https://yourstore.com/change-email',
      },
      transport: {
        type: 'custom',
        send: new ADSMediaEmailSender({
          apiKey: process.env.ADSMEDIA_API_KEY!,
          fromName: 'Your Store',
        }),
      },
    }),
  ],
};
```

### 4. Custom Email Handler (Optional)

```typescript
// src/plugins/adsmedia/order-handlers.ts
import { EmailEventHandler, EmailEventListener } from '@vendure/email-plugin';
import { OrderStateTransitionEvent } from '@vendure/core';

export const orderConfirmationHandler = new EmailEventListener('order-confirmation')
  .on(OrderStateTransitionEvent)
  .filter(event => event.toState === 'PaymentSettled')
  .setRecipient(event => event.order.customer?.emailAddress ?? '')
  .setSubject(`Order Confirmation #{{ order.code }}`)
  .setTemplateVars(event => ({
    order: event.order,
    orderLines: event.order.lines,
  }));

export const orderShippedHandler = new EmailEventListener('order-shipped')
  .on(OrderStateTransitionEvent)
  .filter(event => event.toState === 'Shipped')
  .setRecipient(event => event.order.customer?.emailAddress ?? '')
  .setSubject(`Your Order #{{ order.code }} Has Shipped!`)
  .setTemplateVars(event => ({
    order: event.order,
    fulfillments: event.order.fulfillments,
  }));

export const adsmediaEmailHandlers: EmailEventHandler[] = [
  orderConfirmationHandler,
  orderShippedHandler,
];
```

### 5. Email Templates

```html
<!-- templates/order-confirmation/body.hbs -->
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
    <h1 style="color: white; margin: 0;">Order Confirmed! 🎉</h1>
  </div>
  
  <div style="padding: 30px;">
    <p>Hi {{ order.customer.firstName }},</p>
    <p>Thank you for your order <strong>#{{ order.code }}</strong>!</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background: #f5f5f5;">
        <th style="padding: 12px; text-align: left;">Product</th>
        <th style="padding: 12px; text-align: center;">Qty</th>
        <th style="padding: 12px; text-align: right;">Price</th>
      </tr>
      {{#each orderLines}}
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">{{ productVariant.name }}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">{{ quantity }}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">{{ formatMoney linePriceWithTax }}</td>
      </tr>
      {{/each}}
    </table>
    
    <p style="font-size: 18px; text-align: right;">
      <strong>Total: {{ formatMoney order.totalWithTax }}</strong>
    </p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <h3>Shipping Address</h3>
    <p>
      {{ order.shippingAddress.fullName }}<br>
      {{ order.shippingAddress.streetLine1 }}<br>
      {{#if order.shippingAddress.streetLine2}}{{ order.shippingAddress.streetLine2 }}<br>{{/if}}
      {{ order.shippingAddress.city }}, {{ order.shippingAddress.postalCode }}<br>
      {{ order.shippingAddress.country }}
    </p>
  </div>
</body>
</html>
```

## Use Cases

1. **Order Confirmations** - Automatic after payment
2. **Shipping Notifications** - When order ships
3. **Account Emails** - Registration, password reset
4. **Abandoned Cart** - Recovery emails

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Vendure](https://www.vendure.io)
- [Vendure Email Plugin](https://www.vendure.io/docs/plugins/email-plugin/)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

