# ADSMedia + Heap Integration

Send emails based on Heap analytics segments.

## Setup

### Heap API + ADSMedia

```javascript
const HEAP_APP_ID = process.env.HEAP_APP_ID;
const HEAP_API_KEY = process.env.HEAP_API_KEY;
const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

// Export segment users
async function getSegmentUsers(segmentId) {
  const response = await fetch(
    `https://heapanalytics.com/api/public/${HEAP_APP_ID}/segments/${segmentId}/users`,
    {
      headers: {
        'Authorization': `Bearer ${HEAP_API_KEY}`,
      },
    }
  );
  return response.json();
}

// Send to Heap segment
async function sendToSegment(segmentId, subject, html) {
  const users = await getSegmentUsers(segmentId);
  
  for (const user of users) {
    if (user.email) {
      await fetch('https://api.adsmedia.live/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.email,
          to_name: user.name || '',
          subject,
          html,
          from_name: 'Product Team',
        }),
      });
    }
  }
}

// Example: Onboarding drop-offs
await sendToSegment(
  'segment_123', // "Started but didn't complete onboarding"
  'Need Help Getting Started?',
  '<h1>Let Us Help!</h1><p>We noticed you started onboarding...</p>'
);
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Heap](https://heap.io)

