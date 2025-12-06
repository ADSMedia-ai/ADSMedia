# ADSMedia + Unlayer Integration

Use Unlayer's drag-and-drop email editor with ADSMedia for sending.

## Overview

Unlayer provides a powerful embeddable email editor. This integration allows you to:
- Design emails in Unlayer
- Export HTML and send via ADSMedia
- Save templates and reuse them

## Setup

### 1. Embed Unlayer Editor

```html
<!DOCTYPE html>
<html>
<head>
  <title>Email Editor</title>
  <script src="https://editor.unlayer.com/embed.js"></script>
  <style>
    #editor-container { height: 800px; }
    .toolbar { padding: 20px; background: #f5f5f5; }
    .toolbar button { 
      background: #4F46E5; color: white; 
      padding: 10px 20px; border: none; 
      border-radius: 4px; cursor: pointer; margin: 5px;
    }
    .toolbar input { padding: 10px; width: 300px; margin: 5px; }
  </style>
</head>
<body>
  <div class="toolbar">
    <input type="email" id="recipient" placeholder="Recipient email">
    <input type="text" id="subject" placeholder="Email subject">
    <button onclick="sendEmail()">Send via ADSMedia</button>
    <button onclick="saveTemplate()">Save Template</button>
    <button onclick="loadTemplate()">Load Template</button>
  </div>
  
  <div id="editor-container"></div>

  <script>
    const ADSMEDIA_API_KEY = 'YOUR_API_KEY'; // Use backend proxy in production
    
    // Initialize Unlayer
    unlayer.init({
      id: 'editor-container',
      projectId: YOUR_UNLAYER_PROJECT_ID,
      displayMode: 'email',
    });
    
    // Export HTML and send via ADSMedia
    async function sendEmail() {
      const recipient = document.getElementById('recipient').value;
      const subject = document.getElementById('subject').value;
      
      if (!recipient || !subject) {
        alert('Please enter recipient and subject');
        return;
      }
      
      unlayer.exportHtml(async (data) => {
        const { html } = data;
        
        try {
          const response = await fetch('https://api.adsmedia.live/v1/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: recipient,
              subject: subject,
              html: html,
              from_name: 'Email Editor',
            }),
          });
          
          const result = await response.json();
          
          if (result.success) {
            alert(`Email sent! Message ID: ${result.data.message_id}`);
          } else {
            alert(`Error: ${result.error?.message || 'Failed to send'}`);
          }
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      });
    }
    
    // Save template to localStorage (use database in production)
    function saveTemplate() {
      const name = prompt('Template name:');
      if (!name) return;
      
      unlayer.saveDesign((design) => {
        const templates = JSON.parse(localStorage.getItem('emailTemplates') || '{}');
        templates[name] = design;
        localStorage.setItem('emailTemplates', JSON.stringify(templates));
        alert('Template saved!');
      });
    }
    
    // Load template from localStorage
    function loadTemplate() {
      const templates = JSON.parse(localStorage.getItem('emailTemplates') || '{}');
      const names = Object.keys(templates);
      
      if (names.length === 0) {
        alert('No saved templates');
        return;
      }
      
      const name = prompt(`Available templates:\n${names.join('\n')}\n\nEnter template name:`);
      if (!name || !templates[name]) {
        alert('Template not found');
        return;
      }
      
      unlayer.loadDesign(templates[name]);
    }
  </script>
</body>
</html>
```

### 2. React Integration

```jsx
// UnlayerEmailEditor.jsx
import React, { useRef, useState } from 'react';
import EmailEditor from 'react-email-editor';

const ADSMEDIA_API_KEY = process.env.REACT_APP_ADSMEDIA_API_KEY;

export default function UnlayerEmailEditor() {
  const emailEditorRef = useRef(null);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);

  const sendEmail = () => {
    if (!recipient || !subject) {
      alert('Please enter recipient and subject');
      return;
    }

    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { html } = data;
      setSending(true);

      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient, subject, html }),
        });

        const result = await response.json();
        
        if (result.success) {
          alert(`Email sent! ID: ${result.data.message_id}`);
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        alert(`Error: ${error.message}`);
      }

      setSending(false);
    });
  };

  const saveDesign = () => {
    emailEditorRef.current.editor.saveDesign((design) => {
      console.log('Design saved:', design);
      // Save to your backend
    });
  };

  return (
    <div>
      <div style={{ padding: '20px', background: '#f5f5f5' }}>
        <input
          type="email"
          placeholder="Recipient email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          style={{ padding: '10px', marginRight: '10px', width: '250px' }}
        />
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ padding: '10px', marginRight: '10px', width: '250px' }}
        />
        <button 
          onClick={sendEmail} 
          disabled={sending}
          style={{ 
            background: '#4F46E5', color: 'white', 
            padding: '10px 20px', border: 'none', borderRadius: '4px' 
          }}
        >
          {sending ? 'Sending...' : 'Send via ADSMedia'}
        </button>
        <button 
          onClick={saveDesign}
          style={{ 
            background: '#6B7280', color: 'white', 
            padding: '10px 20px', border: 'none', borderRadius: '4px', marginLeft: '10px' 
          }}
        >
          Save Template
        </button>
      </div>
      
      <EmailEditor
        ref={emailEditorRef}
        onLoad={() => console.log('Editor loaded')}
        projectId={YOUR_UNLAYER_PROJECT_ID}
        minHeight="700px"
      />
    </div>
  );
}
```

### 3. Backend API Route

```javascript
// pages/api/send-email.js (Next.js) or routes/send-email.js (Express)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipient, subject, html } = req.body;

  try {
    const response = await fetch('https://api.adsmedia.live/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ADSMEDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipient,
        subject,
        html,
        from_name: 'Email Editor',
      }),
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Batch Send with Unlayer Templates

```javascript
async function sendCampaign(templateDesign, recipients, subject) {
  // Export HTML from design
  const html = await new Promise((resolve) => {
    // Use Unlayer's server-side rendering or cached export
    resolve(templateDesign.exportedHtml);
  });

  // Send batch via ADSMedia
  const response = await fetch('https://api.adsmedia.live/v1/send/batch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipients: recipients.map(r => ({ email: r.email, name: r.name })),
      subject,
      html,
      from_name: 'Marketing',
    }),
  });

  return response.json();
}
```

## Features

- **Drag & Drop Editor** - Beautiful email designs without coding
- **Mobile Responsive** - Automatic mobile optimization
- **Templates** - Save and reuse designs
- **Merge Tags** - Use ADSMedia personalization placeholders

## Personalization

Use ADSMedia merge tags in Unlayer:

```
%%First Name%% - Recipient's first name
%%Last Name%% - Recipient's last name
%%emailaddress%% - Recipient's email
%%unsubscribelink%% - Unsubscribe URL
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Unlayer](https://unlayer.com)
- [Unlayer Docs](https://docs.unlayer.com)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

