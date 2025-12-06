# ADSMedia + Figma Integration

Export email designs from Figma and send via ADSMedia.

## Overview

This integration enables:
- Export email designs from Figma
- Convert frames to HTML
- Send test emails directly from Figma

## Setup

### 1. Figma Plugin

Create a Figma plugin:

```json
// manifest.json
{
  "name": "ADSMedia Email",
  "id": "adsmedia-email",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"]
}
```

### 2. Plugin Code

```typescript
// code.ts

figma.showUI(__html__, { width: 400, height: 500 });

// Convert Figma frame to HTML
async function frameToHtml(frame: FrameNode): Promise<string> {
  let html = `
    <div style="
      width: ${frame.width}px;
      background: ${getBackgroundColor(frame)};
      font-family: Arial, sans-serif;
    ">
  `;

  for (const child of frame.children) {
    html += await nodeToHtml(child);
  }

  html += '</div>';
  return html;
}

async function nodeToHtml(node: SceneNode): Promise<string> {
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    const styles = getTextStyles(textNode);
    return `<p style="${styles}">${textNode.characters}</p>`;
  }

  if (node.type === 'RECTANGLE') {
    const rect = node as RectangleNode;
    if (rect.fills && rect.fills[0]?.type === 'IMAGE') {
      // Export image
      const imageBytes = await rect.exportAsync({ format: 'PNG' });
      const base64 = figma.base64Encode(imageBytes);
      return `<img src="data:image/png;base64,${base64}" style="width: ${rect.width}px; height: ${rect.height}px;">`;
    }
    return `<div style="width: ${rect.width}px; height: ${rect.height}px; background: ${getFillColor(rect)};"></div>`;
  }

  if (node.type === 'FRAME' || node.type === 'GROUP') {
    const container = node as FrameNode;
    let html = `<div style="position: relative; width: ${container.width}px; height: ${container.height}px;">`;
    for (const child of container.children) {
      html += await nodeToHtml(child);
    }
    html += '</div>';
    return html;
  }

  return '';
}

function getTextStyles(node: TextNode): string {
  const styles: string[] = [];
  
  const fontSize = node.fontSize as number;
  if (fontSize) styles.push(`font-size: ${fontSize}px`);
  
  const fontWeight = node.fontWeight as number;
  if (fontWeight) styles.push(`font-weight: ${fontWeight}`);
  
  const fills = node.fills as Paint[];
  if (fills && fills[0]?.type === 'SOLID') {
    const color = fills[0].color;
    styles.push(`color: rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`);
  }
  
  const textAlign = node.textAlignHorizontal;
  if (textAlign) styles.push(`text-align: ${textAlign.toLowerCase()}`);
  
  return styles.join('; ');
}

function getBackgroundColor(node: FrameNode | RectangleNode): string {
  const fills = node.fills as Paint[];
  if (fills && fills[0]?.type === 'SOLID') {
    const color = fills[0].color;
    return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
  }
  return 'white';
}

function getFillColor(node: RectangleNode): string {
  return getBackgroundColor(node);
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'export-and-send') {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0 || selection[0].type !== 'FRAME') {
      figma.ui.postMessage({ type: 'error', message: 'Please select a frame' });
      return;
    }

    const frame = selection[0] as FrameNode;
    const html = await frameToHtml(frame);

    figma.ui.postMessage({
      type: 'html-ready',
      html: html,
      width: frame.width,
    });
  }
  
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
```

### 3. Plugin UI

```html
<!-- ui.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 20px;
      margin: 0;
    }
    h2 { margin-top: 0; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: 500; }
    input, textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    button {
      background: #4F46E5;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
      font-size: 14px;
    }
    button:hover { background: #4338CA; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    .status { margin-top: 15px; padding: 10px; border-radius: 4px; }
    .success { background: #D1FAE5; color: #065F46; }
    .error { background: #FEE2E2; color: #991B1B; }
  </style>
</head>
<body>
  <h2>📧 ADSMedia Email</h2>
  
  <div class="form-group">
    <label>API Key</label>
    <input type="password" id="apiKey" placeholder="Enter your ADSMedia API key">
  </div>
  
  <div class="form-group">
    <label>Recipient Email</label>
    <input type="email" id="recipient" placeholder="test@example.com">
  </div>
  
  <div class="form-group">
    <label>Subject</label>
    <input type="text" id="subject" placeholder="Email subject">
  </div>
  
  <div class="form-group">
    <label>From Name</label>
    <input type="text" id="fromName" placeholder="Your Company" value="Figma Design">
  </div>
  
  <button id="sendBtn" onclick="exportAndSend()">
    Export & Send Test Email
  </button>
  
  <div id="status"></div>

  <script>
    let exportedHtml = '';

    function exportAndSend() {
      document.getElementById('sendBtn').disabled = true;
      document.getElementById('sendBtn').textContent = 'Exporting...';
      document.getElementById('status').innerHTML = '';
      
      parent.postMessage({ pluginMessage: { type: 'export-and-send' } }, '*');
    }

    async function sendEmail(html) {
      const apiKey = document.getElementById('apiKey').value;
      const recipient = document.getElementById('recipient').value;
      const subject = document.getElementById('subject').value;
      const fromName = document.getElementById('fromName').value;

      if (!apiKey || !recipient || !subject) {
        showStatus('Please fill all required fields', 'error');
        return;
      }

      document.getElementById('sendBtn').textContent = 'Sending...';

      try {
        const response = await fetch('https://api.adsmedia.live/v1/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: recipient,
            to_name: '',
            subject: subject,
            html: wrapInEmailTemplate(html),
            from_name: fromName,
          }),
        });

        const result = await response.json();

        if (result.success) {
          showStatus(`Email sent! Message ID: ${result.data.message_id}`, 'success');
        } else {
          showStatus(`Error: ${result.error?.message || 'Failed to send'}`, 'error');
        }
      } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
      }

      document.getElementById('sendBtn').disabled = false;
      document.getElementById('sendBtn').textContent = 'Export & Send Test Email';
    }

    function wrapInEmailTemplate(html) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 20px;">
                ${html}
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    }

    function showStatus(message, type) {
      document.getElementById('status').innerHTML = `<div class="status ${type}">${message}</div>`;
    }

    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      
      if (msg.type === 'html-ready') {
        exportedHtml = msg.html;
        sendEmail(exportedHtml);
      }
      
      if (msg.type === 'error') {
        showStatus(msg.message, 'error');
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('sendBtn').textContent = 'Export & Send Test Email';
      }
    };
  </script>
</body>
</html>
```

## Usage

1. Install the plugin in Figma
2. Design your email (recommended: 600px width frame)
3. Select the frame
4. Run the plugin (Plugins → ADSMedia Email)
5. Enter API key and recipient
6. Click "Export & Send Test Email"

## Design Guidelines

For best results:
- Use 600px width frames
- Use web-safe fonts (Arial, Georgia, etc.)
- Keep designs simple (tables work better in email)
- Test on multiple email clients

## Alternative: REST API

Export HTML manually and send via API:

```javascript
// Export frame as HTML/CSS
const frame = figma.currentPage.selection[0];
const html = await frame.exportAsync({ format: 'SVG' });

// Convert and send via your backend
fetch('https://your-backend.com/send-figma-email', {
  method: 'POST',
  body: JSON.stringify({ designSvg: html, recipient: 'test@example.com' }),
});
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Figma](https://www.figma.com)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

