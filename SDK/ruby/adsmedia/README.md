# ADSMedia Ruby SDK

Official Ruby SDK for ADSMedia Email API.

## Installation

```bash
gem install adsmedia
```

Or add to Gemfile:

```ruby
gem 'adsmedia'
```

## Quick Start

```ruby
require 'adsmedia'

client = ADSMedia::Client.new('your-api-key')

# Send email
result = client.send_email(
  to: 'user@example.com',
  subject: 'Hello!',
  html: '<h1>Welcome!</h1>'
)

puts "Message ID: #{result['message_id']}"
```

## Send Batch

```ruby
result = client.send_batch(
  recipients: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' }
  ],
  subject: 'Hello %%First Name%%!',
  html: '<h1>Hi %%First Name%%!</h1>'
)

puts "Task ID: #{result['task_id']}"
```

## Campaigns

```ruby
# List campaigns
campaigns = client.get_campaigns

# Create campaign
campaign = client.create_campaign(
  name: 'Newsletter Q1',
  subject: 'Monthly Update',
  html: '<h1>Newsletter</h1>'
)
```

## Lists

```ruby
# Get lists
lists = client.get_lists

# Create list
list = client.create_list(name: 'Newsletter Subscribers')

# Add contacts
client.add_contacts(
  list_id: list['id'],
  contacts: [
    { email: 'john@example.com', firstName: 'John' },
    { email: 'jane@example.com', firstName: 'Jane' }
  ]
)
```

## Check Suppression

```ruby
result = client.check_suppression('user@example.com')

if result['suppressed']
  puts "Suppressed: #{result['reason']}"
else
  puts "OK to send"
end
```

## API Reference

### Email
- `send_email(to:, subject:, html:, **options)`
- `send_batch(recipients:, subject:, html:, **options)`
- `get_status(message_id)`

### Campaigns
- `get_campaigns(limit:, offset:)`
- `get_campaign(id)`
- `create_campaign(name:, subject:, html:, **options)`

### Lists
- `get_lists`
- `create_list(name:, type:)`
- `add_contacts(list_id:, contacts:)`

### Other
- `ping`
- `get_servers`
- `verify_domain(server_id)`
- `check_suppression(email)`
- `get_account`
- `get_usage`

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

