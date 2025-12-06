# ADSMedia Send Email - GitHub Action

Send emails via ADSMedia Email API in your GitHub Actions workflows.

## Usage

```yaml
- name: Send Email
  uses: ADSMedia-ai/ADSMedia/CI-CD/github-action@main
  with:
    api-key: ${{ secrets.ADSMEDIA_API_KEY }}
    to: recipient@example.com
    subject: 'Deployment Notification'
    html: '<h1>Deployed!</h1><p>Version ${{ github.sha }} deployed.</p>'
```

## Inputs

| Input | Description | Required |
|-------|-------------|----------|
| `api-key` | ADSMedia API key | ✅ |
| `to` | Recipient email address | ✅ |
| `subject` | Email subject line | ✅ |
| `html` | HTML content | ❌* |
| `text` | Plain text content | ❌* |
| `to-name` | Recipient name | ❌ |
| `from-name` | Sender display name | ❌ |
| `reply-to` | Reply-to email | ❌ |
| `server-id` | Specific server ID | ❌ |

*Either `html` or `text` is required

## Outputs

| Output | Description |
|--------|-------------|
| `message-id` | Message ID of the sent email |
| `send-id` | Send ID for tracking |
| `status` | Email status |

## Examples

### Deployment Notification

```yaml
name: Deploy and Notify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy
        run: echo "Deploying..."
      
      - name: Notify Team
        uses: ADSMedia-ai/ADSMedia/CI-CD/github-action@main
        with:
          api-key: ${{ secrets.ADSMEDIA_API_KEY }}
          to: team@example.com
          subject: '🚀 Deployed: ${{ github.repository }}'
          html: |
            <h1>Deployment Complete</h1>
            <p><strong>Repository:</strong> ${{ github.repository }}</p>
            <p><strong>Branch:</strong> ${{ github.ref_name }}</p>
            <p><strong>Commit:</strong> ${{ github.sha }}</p>
            <p><strong>By:</strong> ${{ github.actor }}</p>
```

### Build Failure Alert

```yaml
name: Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build
        id: build
        run: npm run build
        continue-on-error: true
      
      - name: Alert on Failure
        if: steps.build.outcome == 'failure'
        uses: ADSMedia-ai/ADSMedia/CI-CD/github-action@main
        with:
          api-key: ${{ secrets.ADSMEDIA_API_KEY }}
          to: dev@example.com
          subject: '❌ Build Failed: ${{ github.repository }}'
          html: |
            <h1>Build Failed</h1>
            <p>The build for <strong>${{ github.repository }}</strong> failed.</p>
            <p><a href="${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}">View logs</a></p>
```

### Release Announcement

```yaml
name: Release

on:
  release:
    types: [published]

jobs:
  announce:
    runs-on: ubuntu-latest
    steps:
      - name: Announce Release
        uses: ADSMedia-ai/ADSMedia/CI-CD/github-action@main
        with:
          api-key: ${{ secrets.ADSMEDIA_API_KEY }}
          to: users@example.com
          subject: '🎉 New Release: ${{ github.event.release.tag_name }}'
          html: |
            <h1>${{ github.event.release.name }}</h1>
            ${{ github.event.release.body }}
            <p><a href="${{ github.event.release.html_url }}">Download</a></p>
```

## Setup

1. Get your API key from [adsmedia.ai](https://www.adsmedia.ai)
2. Add it as a secret in your repository:
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `ADSMEDIA_API_KEY`
   - Value: Your API key

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

