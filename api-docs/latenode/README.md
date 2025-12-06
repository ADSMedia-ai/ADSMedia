# ADSMedia + Latenode Integration

Use ADSMedia API with Latenode automation platform.

## Setup

### 1. Add HTTP Request Node

1. Create new scenario in Latenode
2. Add **HTTP Request** node
3. Configure:

```
Method: POST
URL: https://api.adsmedia.live/v1/send
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json
Body (JSON):
{
  "to": "{{email}}",
  "to_name": "{{name}}",
  "subject": "Your Subject",
  "html": "<h1>Hello {{name}}</h1>",
  "from_name": "Your Company"
}
```

### 2. Use Variables

Map data from previous nodes:
- `{{trigger.email}}` - from form submission
- `{{trigger.name}}` - from webhook data
- `{{database.user.email}}` - from database query

### 3. Error Handling

Add condition node to check response:
```javascript
if (response.success) {
  // Continue workflow
} else {
  // Handle error
}
```

## Example Scenarios

### Form to Email
1. **Trigger:** Webhook (form submission)
2. **Action:** HTTP Request to ADSMedia
3. **Output:** Log message ID

### Scheduled Newsletter
1. **Trigger:** Schedule (weekly)
2. **Query:** Database (get subscribers)
3. **Loop:** For each subscriber
4. **Action:** Send email via ADSMedia

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Latenode](https://latenode.com)

