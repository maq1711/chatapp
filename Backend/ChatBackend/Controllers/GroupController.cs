using Microsoft.AspNetCore.Mvc;

namespace ChatBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroupController : ControllerBase
{
    private readonly ILogger<GroupController> _logger;

    public GroupController(ILogger<GroupController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public ActionResult<List<object>> GetAllGroups()
    {
        _logger.LogInformation("Fetching all groups");
        
        return Ok(new List<object>
        {
            new { id = 1, name = "Project Team", members = 5 },
            new { id = 2, name = "General Chat", members = 12 }
        });
    }

    [HttpPost("create")]
    public ActionResult<object> CreateGroup([FromBody] CreateGroupDto groupData)
    {
        if (string.IsNullOrEmpty(groupData.Name))
        {
            return BadRequest("Group name is required");
        }

        if (groupData.Members == null || groupData.Members.Count < 3)
        {
            return BadRequest("At least 3 members are required to create a group");
        }

        _logger.LogInformation($"Creating group: {groupData.Name}");

        // TODO: Save group to database
        return Ok(new { status = "success", groupId = Guid.NewGuid(), name = groupData.Name });
    }

    [HttpGet("{groupId}")]
    public ActionResult<object> GetGroup(string groupId)
    {
        _logger.LogInformation($"Fetching group: {groupId}");
        
        return Ok(new 
        { 
            id = groupId, 
            name = "Project Team",
            description = "Team collaboration group",
            members = new[] { "User1", "User2", "User3" }
        });
    }
}

public class CreateGroupDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public List<int>? Members { get; set; }
}
