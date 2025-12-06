# ADSMedia + DatoCMS Integration

Send emails using content from DatoCMS via ADSMedia.

## Overview

DatoCMS is a headless CMS. This integration enables:
- Email templates stored in DatoCMS
- Dynamic content in emails
- Newsletter automation

## Setup

### 1. Install Dependencies

```bash
npm install datocms-client
```

### 2. DatoCMS + ADSMedia Client

```typescript
// src/datocms-adsmedia.ts
import { buildClient } from '@datocms/cma-client-node';

const DATOCMS_API_TOKEN = process.env.DATOCMS_API_TOKEN!;
const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY!;

const client = buildClient({ apiToken: DATOCMS_API_TOKEN });

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

// GraphQL query helper
async function queryDatoCMS(query: string, variables = {}) {
  const response = await fetch('https://graphql.datocms.com/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DATOCMS_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}

// Fetch email template and send
export async function sendNewsletterFromDatoCMS(
  templateSlug: string,
  recipient: { email: string; name: string }
) {
  const { data } = await queryDatoCMS(`
    query GetEmailTemplate($slug: String!) {
      emailTemplate(filter: { slug: { eq: $slug } }) {
        subject
        preheader
        headerImage { url }
        title
        content
        ctaText
        ctaUrl
        footerText
        backgroundColor { hex }
        primaryColor { hex }
      }
    }
  `, { slug: templateSlug });

  const template = data.emailTemplate;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: ${template.primaryColor?.hex || '#4F46E5'}; padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .content { padding: 30px; background: ${template.backgroundColor?.hex || '#ffffff'}; }
        .cta { text-align: center; margin: 30px 0; }
        .cta a { background: ${template.primaryColor?.hex || '#4F46E5'}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 4px; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        ${template.headerImage ? `
          <div style="text-align: center;">
            <img src="${template.headerImage.url}" alt="" style="max-width: 100%;">
          </div>
        ` : ''}
        
        <div class="header">
          <h1>${template.title}</h1>
        </div>
        
        <div class="content">
          ${template.content}
        </div>
        
        ${template.ctaText && template.ctaUrl ? `
          <div class="cta">
            <a href="${template.ctaUrl}">${template.ctaText}</a>
          </div>
        ` : ''}
        
        <div class="footer">
          ${template.footerText || ''}
          <p><a href="%%unsubscribelink%%">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(
    recipient.email,
    recipient.name,
    template.subject,
    html
  );
}
```

### 3. DatoCMS Model

Create an `email_template` model with these fields:

| Field | Type | API Key |
|-------|------|---------|
| Subject | Single-line string | subject |
| Slug | Slug | slug |
| Preheader | Single-line string | preheader |
| Header Image | Single asset | header_image |
| Title | Single-line string | title |
| Content | Structured text | content |
| CTA Text | Single-line string | cta_text |
| CTA URL | Single-line string | cta_url |
| Footer Text | Multi-line text | footer_text |
| Background Color | Color | background_color |
| Primary Color | Color | primary_color |

### 4. Webhook Integration

```typescript
// api/datocms-webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // Verify DatoCMS webhook signature
  const signature = req.headers['x-datocms-signature'];
  // Verify signature in production

  const { event_type, entity } = req.body;

  if (event_type === 'item.publish' && entity.relationships.item_type.data.id === 'email_template_model_id') {
    const templateSlug = entity.attributes.slug;
    
    // Check if auto-send is enabled
    if (entity.attributes.auto_send) {
      const subscribers = await getSubscribers(); // Your function
      
      for (const subscriber of subscribers) {
        await sendNewsletterFromDatoCMS(templateSlug, subscriber);
      }
    }
  }

  res.status(200).json({ ok: true });
}
```

### 5. Structured Text to HTML

```typescript
import { render } from 'datocms-structured-text-to-html-string';

function structuredTextToHtml(structuredText: any): string {
  return render(structuredText, {
    renderBlock: ({ record }) => {
      switch (record.__typename) {
        case 'ImageRecord':
          return `<img src="${record.image.url}" alt="${record.image.alt}" style="max-width: 100%;">`;
        case 'ButtonRecord':
          return `<p style="text-align: center;"><a href="${record.url}" style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">${record.label}</a></p>`;
        default:
          return '';
      }
    },
  });
}
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [DatoCMS](https://www.datocms.com)
- [DatoCMS Documentation](https://www.datocms.com/docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

