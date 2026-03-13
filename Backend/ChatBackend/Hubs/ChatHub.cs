using Microsoft.AspNetCore.SignalR;

namespace ChatBackend.Hubs;

public class ChatHub : Hub
{
    // Dictionary to store connected users
    private static readonly Dictionary<string, string> ConnectedUsers = new();

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
        Console.WriteLine($"User connected: {Context.ConnectionId}");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ConnectedUsers.ContainsKey(Context.ConnectionId))
        {
            ConnectedUsers.Remove(Context.ConnectionId);
        }
        await base.OnDisconnectedAsync(exception);
        Console.WriteLine($"User disconnected: {Context.ConnectionId}");
    }

    // Send message to specific user
    public async Task SendPrivateMessage(string receiverId, string message, string senderName)
    {
        await Clients.Client(receiverId).SendAsync("ReceivePrivateMessage", senderName, message);
    }

    // Send message to group
    public async Task SendGroupMessage(string groupName, string message, string senderName)
    {
        await Clients.Group(groupName).SendAsync("ReceiveGroupMessage", senderName, message);
    }

    // Join a chat group
    public async Task JoinWebsite(string userId, string userName)
    {
        ConnectedUsers[Context.ConnectionId] = userName;
        await Groups.AddToGroupAsync(Context.ConnectionId, "website");
        await Clients.Group("website").SendAsync("UserJoined", userName);
    }

    // Join a specific group
    public async Task JoinGroup(string groupName, string userName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Clients.Group(groupName).SendAsync("UserJoinedGroup", userName, groupName);
    }

    // Leave a group
    public async Task LeaveGroup(string groupName, string userName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        await Clients.Group(groupName).SendAsync("UserLeftGroup", userName, groupName);
    }
}
