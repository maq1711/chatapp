using Microsoft.AspNetCore.Mvc;

namespace ChatBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MessageController : ControllerBase
{
    private readonly ILogger<MessageController> _logger;

    public MessageController(ILogger<MessageController> logger)
    {
        _logger = logger;
    }

    [HttpGet("history/{groupId}")]
    public ActionResult<List<object>> GetMessageHistory(string groupId)
    {
        // TODO: Implement message history retrieval from database
        _logger.LogInformation($"Fetching message history for group: {groupId}");
        
        return Ok(new List<object>
        {
            new { id = 1, text = "Hello", sender = "User1", timestamp = DateTime.UtcNow },
            new { id = 2, text = "Hi there", sender = "User2", timestamp = DateTime.UtcNow }
        });
    }

    [HttpPost("send")]
    public ActionResult<object> SendMessage([FromBody] MessageDto message)
    {
        if (string.IsNullOrEmpty(message.Text))
        {
            return BadRequest("Message text cannot be empty");
        }

        _logger.LogInformation($"Message received from {message.Sender}");

        // TODO: Save message to database and broadcast via SignalR
        return Ok(new { status = "success", messageId = Guid.NewGuid() });
    }
}

public class MessageDto
{
    public string? Text { get; set; }
    public string? Sender { get; set; }
    public string? GroupId { get; set; }
}
