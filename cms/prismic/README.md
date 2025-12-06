# ADSMedia + Prismic Integration

Send emails using content from Prismic CMS via ADSMedia.

## Overview

Prismic is a headless CMS. This integration enables:
- Email templates from Prismic content
- Newsletter automation
- Dynamic email content

## Setup

### 1. Prismic Client

```typescript
// src/prismic-adsmedia.ts
import * as prismic from '@prismicio/client';

const PRISMIC_REPO = 'your-repo-name';
const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY!;

const client = prismic.createClient(PRISMIC_REPO);

async function sendEmail(to: string, toName: string, subject: string, html: string) {
  const response = await fetch('https://api.adsmedia.live/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      to_name: toName,
      subject,
      html,
      from_name: 'Newsletter',
    }),
  });
  return response.json();
}

// Fetch email template from Prismic and send
export async function sendNewsletterFromPrismic(
  templateId: string,
  recipient: { email: string; name: string }
) {
  // Get email template from Prismic
  const template = await client.getByUID('email_template', templateId);
  
  // Build HTML from Prismic content
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${template.data.header_image?.url ? `
        <div style="text-align: center;">
          <img src="${template.data.header_image.url}" alt="" style="max-width: 100%;">
        </div>
      ` : ''}
      
      <div style="padding: 30px;">
        <h1>${prismic.asText(template.data.title)}</h1>
        ${prismic.asHTML(template.data.content)}
        
        ${template.data.cta_text && template.data.cta_link ? `
          <p style="text-align: center; margin-top: 30px;">
            <a href="${template.data.cta_link.url}" style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">
              ${template.data.cta_text}
            </a>
          </p>
        ` : ''}
      </div>
      
      <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px;">
        ${prismic.asHTML(template.data.footer)}
      </div>
    </body>
    </html>
  `;

  return sendEmail(
    recipient.email,
    recipient.name,
    prismic.asText(template.data.subject),
    html
  );
}

// Send newsletter to all subscribers
export async function sendCampaignFromPrismic(templateId: string) {
  // Get subscribers from your database
  const subscribers = await getSubscribers(); // Your function
  
  const template = await client.getByUID('email_template', templateId);
  const subject = prismic.asText(template.data.subject);
  
  // Build HTML...
  const html = buildHtmlFromTemplate(template);

  // Send batch
  const response = await fetch('https://api.adsmedia.live/v1/send/batch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipients: subscribers.map(s => ({ email: s.email, name: s.name })),
      subject,
      html,
      from_name: 'Newsletter',
    }),
  });

  return response.json();
}
```

### 2. Prismic Custom Type

Create an `email_template` custom type in Prismic:

```json
{
  "id": "email_template",
  "label": "Email Template",
  "repeatable": true,
  "json": {
    "Main": {
      "uid": { "type": "UID", "config": { "label": "Template ID" } },
      "subject": { "type": "StructuredText", "config": { "label": "Subject", "single": "paragraph" } },
      "title": { "type": "StructuredText", "config": { "label": "Title", "single": "heading1" } },
      "header_image": { "type": "Image", "config": { "label": "Header Image" } },
      "content": { "type": "StructuredText", "config": { "label": "Content", "multi": "paragraph,heading2,heading3,strong,em,hyperlink,list-item,o-list-item" } },
      "cta_text": { "type": "Text", "config": { "label": "CTA Button Text" } },
      "cta_link": { "type": "Link", "config": { "label": "CTA Button Link" } },
      "footer": { "type": "StructuredText", "config": { "label": "Footer", "multi": "paragraph,hyperlink" } }
    }
  }
}
```

### 3. Webhook on Content Update

```typescript
// api/prismic-webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { type, documents } = req.body;

  if (type === 'api-update') {
    // Check if any email templates were published
    const emailTemplates = documents.filter((d: any) => d.type === 'email_template');
    
    for (const template of emailTemplates) {
      if (template.tags?.includes('auto-send')) {
        // Auto-send newsletter when template with 'auto-send' tag is published
        await sendCampaignFromPrismic(template.uid);
      }
    }
  }

  res.status(200).json({ ok: true });
}
```

## Prismic Slice Integration

For Slice Machine projects:

```typescript
// slices/EmailContent/index.tsx
import { SliceComponentProps } from '@prismicio/react';
import * as prismic from '@prismicio/client';

export default function EmailContent({ slice }: SliceComponentProps) {
  // This generates HTML for email
  return `
    <div style="padding: 20px;">
      <h2 style="color: ${slice.primary.heading_color};">
        ${prismic.asText(slice.primary.heading)}
      </h2>
      ${prismic.asHTML(slice.primary.body)}
    </div>
  `;
}

// Build full email from slices
export function buildEmailFromSlices(document: any): string {
  let html = '<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">';
  
  for (const slice of document.data.slices) {
    switch (slice.slice_type) {
      case 'email_header':
        html += `<div style="background: ${slice.primary.bg_color}; padding: 40px; text-align: center;">
          <h1 style="color: white;">${prismic.asText(slice.primary.title)}</h1>
        </div>`;
        break;
      case 'email_content':
        html += EmailContent({ slice });
        break;
      case 'email_cta':
        html += `<div style="text-align: center; padding: 30px;">
          <a href="${slice.primary.link.url}" style="background: ${slice.primary.button_color}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 4px;">
            ${slice.primary.button_text}
          </a>
        </div>`;
        break;
    }
  }
  
  html += '</div>';
  return html;
}
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Prismic](https://prismic.io)
- [Prismic Documentation](https://prismic.io/docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

