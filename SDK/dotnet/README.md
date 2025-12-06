# ADSMedia .NET SDK

Official .NET SDK for ADSMedia Email API.

## Installation

```bash
dotnet add package ADSMedia.SDK
```

## Quick Start

```csharp
using ADSMedia.SDK;

var client = new ADSMediaClient("your-api-key");

// Send email
var result = await client.SendAsync(new SendEmailRequest
{
    To = "user@example.com",
    Subject = "Hello!",
    Html = "<h1>Welcome!</h1>",
});

Console.WriteLine($"Message ID: {result.MessageId}");
```

## Send Batch

```csharp
var result = await client.SendBatchAsync(new BatchEmailRequest
{
    Recipients = new List<Recipient>
    {
        new() { Email = "user1@example.com", Name = "User 1" },
        new() { Email = "user2@example.com", Name = "User 2" },
    },
    Subject = "Hello %%First Name%%!",
    Html = "<h1>Hi %%First Name%%!</h1>",
});

Console.WriteLine($"Task ID: {result.TaskId}");
```

## Check Suppression

```csharp
var result = await client.CheckSuppressionAsync("user@example.com");

if (result.Suppressed)
{
    Console.WriteLine($"Suppressed: {result.Reason}");
}
else
{
    Console.WriteLine("OK to send");
}
```

## Test Connection

```csharp
var ping = await client.PingAsync();
Console.WriteLine($"Connected! User ID: {ping.UserId}");
```

## Get Usage

```csharp
var usage = await client.GetUsageAsync();
Console.WriteLine($"Sent this month: {usage.SentThisMonth}");
```

## API Reference

### Email
- `SendAsync(SendEmailRequest)` - Send single email
- `SendBatchAsync(BatchEmailRequest)` - Send batch emails

### Account
- `PingAsync()` - Test connection
- `GetUsageAsync()` - Get usage stats
- `CheckSuppressionAsync(string email)` - Check suppression

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

