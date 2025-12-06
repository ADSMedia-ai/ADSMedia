# ADSMedia + OpenRouter Integration

Combine AI-generated content from OpenRouter with ADSMedia email sending.

## Setup

### Generate and Send Email

```javascript
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

async function generateAndSendEmail(recipient, topic) {
  // 1. Generate email content with AI
  const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4',
      messages: [{
        role: 'user',
        content: `Write a professional email about: ${topic}. 
                  Return JSON with "subject" and "html" fields.
                  Make HTML properly formatted for email.`
      }],
    }),
  });

  const aiData = await aiResponse.json();
  const emailContent = JSON.parse(aiData.choices[0].message.content);

  // 2. Send via ADSMedia
  const emailResponse = await fetch('https://api.adsmedia.live/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: recipient.email,
      to_name: recipient.name,
      subject: emailContent.subject,
      html: emailContent.html,
      from_name: 'AI Assistant',
    }),
  });

  return emailResponse.json();
}

// Usage
await generateAndSendEmail(
  { email: 'user@example.com', name: 'John' },
  'Monthly product update for SaaS platform'
);
```

### AI-Powered Subject Lines

```javascript
async function generateSubjectLines(emailContent, count = 5) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-sonnet',
      messages: [{
        role: 'user',
        content: `Generate ${count} compelling email subject lines for this content:
                  ${emailContent}
                  Return as JSON array of strings.`
      }],
    }),
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

### Personalized Campaigns

```javascript
async function sendPersonalizedCampaign(subscribers, baseContent) {
  for (const subscriber of subscribers) {
    // Generate personalized version
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Personalize this email for ${subscriber.name} who works in ${subscriber.industry}:
                    ${baseContent}`
        }],
      }),
    });

    const personalized = await response.json();
    
    // Send personalized email
    await fetch('https://api.adsmedia.live/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: subscriber.email,
        to_name: subscriber.name,
        subject: 'Personalized Update for You',
        html: personalized.choices[0].message.content,
        from_name: 'Your Team',
      }),
    });
  }
}
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [OpenRouter](https://openrouter.ai)

