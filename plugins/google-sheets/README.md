# ADSMedia for Google Sheets

Send emails directly from Google Sheets using ADSMedia API.

## Features

- 📧 Send individual emails row by row
- 📬 Send batch emails with personalization
- ✅ Custom functions for spreadsheets
- 📊 Usage statistics

## Setup

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Delete any existing code and paste the contents of `Code.gs`
4. Click **Project Settings** (gear icon)
5. Scroll to **Script Properties**
6. Click **Add script property**:
   - Property: `ADSMEDIA_API_KEY`
   - Value: Your API key from [adsmedia.ai](https://www.adsmedia.ai)
7. Save and refresh your spreadsheet

## Usage

### Custom Functions

Use these in any cell:

```
=ADSMEDIA_PING()
Returns: "Connected! User: 123"

=ADSMEDIA_SEND("user@example.com", "Hello!", "<h1>Hi!</h1>")
Returns: "Sent! ID: api-123-abc"

=ADSMEDIA_CHECK_SUPPRESSION("user@example.com")
Returns: "Not suppressed" or "Suppressed: hard bounce"
```

### Menu Options

After setup, you'll see a **📧 ADSMedia** menu:

1. **Send Bulk Emails** - Send to each row individually
   - Select rows with columns: Email | Name | Subject | HTML
   - Click menu item to send

2. **Send Batch Emails** - Send personalized campaign
   - Select rows with columns: Email | Name
   - Enter subject and HTML template
   - Uses `%%First Name%%` placeholders

3. **View Usage Stats** - See your account usage

4. **Test Connection** - Verify API key is working

## Spreadsheet Format

### For Bulk Sending (row by row)

| A (Email) | B (Name) | C (Subject) | D (HTML) |
|-----------|----------|-------------|----------|
| john@example.com | John | Hello John! | `<h1>Hi!</h1>` |
| jane@example.com | Jane | Hello Jane! | `<h1>Hi!</h1>` |

### For Batch Sending (personalized)

| A (Email) | B (Name) |
|-----------|----------|
| john@example.com | John |
| jane@example.com | Jane |

Then enter subject/HTML with `%%First Name%%` placeholders.

## Personalization Placeholders

Use in batch emails:

| Placeholder | Description |
|-------------|-------------|
| `%%First Name%%` | Recipient's name (from column B) |
| `%%emailaddress%%` | Recipient's email |

## Rate Limits

- ADSMedia API: 100 requests/minute
- Bulk sends include a 100ms delay between emails
- Batch sends: max 1000 recipients per call

## Troubleshooting

**"API key not set"**
- Go to Project Settings → Script Properties
- Add `ADSMEDIA_API_KEY` with your key

**"Authorization required"**
- First run requires permission approval
- Click "Review Permissions" and allow access

**Emails not sending**
- Check if email is suppressed: `=ADSMEDIA_CHECK_SUPPRESSION(A1)`
- Verify API key is correct with `=ADSMEDIA_PING()`

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

