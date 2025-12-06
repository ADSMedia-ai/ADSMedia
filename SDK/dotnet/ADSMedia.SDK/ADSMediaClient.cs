using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ADSMedia.SDK;

public class ADSMediaClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private const string BaseUrl = "https://api.adsmedia.live/v1";

    public ADSMediaClient(string apiKey)
    {
        _apiKey = apiKey ?? throw new ArgumentNullException(nameof(apiKey));
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
    }

    private async Task<T> RequestAsync<T>(string method, string endpoint, object? body = null)
    {
        var request = new HttpRequestMessage(new HttpMethod(method), $"{BaseUrl}{endpoint}");

        if (body != null)
        {
            var json = JsonSerializer.Serialize(body);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        var response = await _httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        
        var result = JsonSerializer.Deserialize<ApiResponse<T>>(content);
        
        if (result == null || !result.Success)
        {
            throw new ADSMediaException(result?.Error?.Message ?? "API Error");
        }

        return result.Data!;
    }

    public async Task<SendResult> SendAsync(SendEmailRequest request)
    {
        return await RequestAsync<SendResult>("POST", "/send", request);
    }

    public async Task<BatchResult> SendBatchAsync(BatchEmailRequest request)
    {
        return await RequestAsync<BatchResult>("POST", "/send/batch", request);
    }

    public async Task<SuppressionResult> CheckSuppressionAsync(string email)
    {
        return await RequestAsync<SuppressionResult>("GET", $"/suppressions/check?email={Uri.EscapeDataString(email)}");
    }

    public async Task<PingResult> PingAsync()
    {
        return await RequestAsync<PingResult>("GET", "/ping");
    }

    public async Task<UsageResult> GetUsageAsync()
    {
        return await RequestAsync<UsageResult>("GET", "/account/usage");
    }
}

public class ApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("error")]
    public ApiError? Error { get; set; }
}

public class ApiError
{
    [JsonPropertyName("message")]
    public string? Message { get; set; }
}

public class SendEmailRequest
{
    [JsonPropertyName("to")]
    public string To { get; set; } = "";

    [JsonPropertyName("to_name")]
    public string? ToName { get; set; }

    [JsonPropertyName("subject")]
    public string Subject { get; set; } = "";

    [JsonPropertyName("html")]
    public string Html { get; set; } = "";

    [JsonPropertyName("text")]
    public string? Text { get; set; }

    [JsonPropertyName("from_name")]
    public string? FromName { get; set; }

    [JsonPropertyName("reply_to")]
    public string? ReplyTo { get; set; }
}

public class BatchEmailRequest
{
    [JsonPropertyName("recipients")]
    public List<Recipient> Recipients { get; set; } = new();

    [JsonPropertyName("subject")]
    public string Subject { get; set; } = "";

    [JsonPropertyName("html")]
    public string Html { get; set; } = "";

    [JsonPropertyName("text")]
    public string? Text { get; set; }

    [JsonPropertyName("preheader")]
    public string? Preheader { get; set; }

    [JsonPropertyName("from_name")]
    public string? FromName { get; set; }
}

public class Recipient
{
    [JsonPropertyName("email")]
    public string Email { get; set; } = "";

    [JsonPropertyName("name")]
    public string? Name { get; set; }
}

public class SendResult
{
    [JsonPropertyName("message_id")]
    public string MessageId { get; set; } = "";

    [JsonPropertyName("send_id")]
    public int SendId { get; set; }

    [JsonPropertyName("to")]
    public string To { get; set; } = "";

    [JsonPropertyName("status")]
    public string Status { get; set; } = "";
}

public class BatchResult
{
    [JsonPropertyName("task_id")]
    public int TaskId { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "";
}

public class SuppressionResult
{
    [JsonPropertyName("suppressed")]
    public bool Suppressed { get; set; }

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }
}

public class PingResult
{
    [JsonPropertyName("userId")]
    public int UserId { get; set; }

    [JsonPropertyName("version")]
    public string Version { get; set; } = "";
}

public class UsageResult
{
    [JsonPropertyName("servers")]
    public int Servers { get; set; }

    [JsonPropertyName("lists")]
    public int Lists { get; set; }

    [JsonPropertyName("schedules")]
    public int Schedules { get; set; }

    [JsonPropertyName("sent_this_month")]
    public int SentThisMonth { get; set; }
}

public class ADSMediaException : Exception
{
    public ADSMediaException(string message) : base(message) { }
}

