using Microsoft.AspNetCore.SignalR;

namespace ChatBackend.Hubs;

// Model for connected users
public class ConnectedUser
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ConnectionId { get; set; } = string.Empty;
}

public class ChatHub : Hub
{
    // Static dictionary: connectionId -> user info
    private static readonly Dictionary<string, ConnectedUser> ConnectedUsers = new();

    // When a user connects: read name & userId from query string, store in dictionary, broadcast user list
    public override async Task OnConnectedAsync()
    {
        var name = Context.GetHttpContext()?.Request.Query["name"].ToString() ?? "";
        var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString() ?? "0";
        var connectionId = Context.ConnectionId;

        var user = new ConnectedUser
        {
            Id = int.TryParse(userId, out var id) ? id : 0,
            Name = name,
            ConnectionId = connectionId
        };

        // Remove any existing connections for the same user (handles browser refresh / StrictMode double-mount)
        var staleKeys = ConnectedUsers
            .Where(kv => kv.Value.Id == user.Id)
            .Select(kv => kv.Key)
            .ToList();
        foreach (var key in staleKeys)
        {
            ConnectedUsers.Remove(key);
        }

        ConnectedUsers[connectionId] = user;
        Console.WriteLine($"User connected: {name} (ID: {userId}, ConnId: {connectionId})");

        // Send updated user list to ALL clients
        await Clients.All.SendAsync("UserList", ConnectedUsers.Values.ToArray());

        // Notify others that a new user joined
        await Clients.Others.SendAsync("UserJoined", name);

        await base.OnConnectedAsync();
    }

    // When a user disconnects: remove from dictionary, notify everyone
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;
        ConnectedUser? disconnectedUser = null;

        if (ConnectedUsers.ContainsKey(connectionId))
        {
            disconnectedUser = ConnectedUsers[connectionId];
            ConnectedUsers.Remove(connectionId);
        }

        // Notify all clients to remove this user from their list
        if (disconnectedUser != null)
        {
            await Clients.All.SendAsync("RemoveUser", disconnectedUser.Id);
            Console.WriteLine($"User disconnected: {disconnectedUser.Name} (ID: {disconnectedUser.Id})");
        }

        // Send updated user list
        await Clients.All.SendAsync("UserList", ConnectedUsers.Values.ToArray());

        await base.OnDisconnectedAsync(exception);
    }

    // Send private message using receiver's connectionId
    public async Task SendPrivateMessage(string message, string receiverConnectionId)
    {
        var senderConnectionId = Context.ConnectionId;

        if (!ConnectedUsers.ContainsKey(senderConnectionId))
            return;

        var sender = ConnectedUsers[senderConnectionId];

        // Check if receiver is still online
        if (ConnectedUsers.ContainsKey(receiverConnectionId))
        {
            // Send to the specific receiver
            await Clients.Client(receiverConnectionId).SendAsync(
                "ReceivePrivateMessage",
                sender.Name,
                message,
                senderConnectionId,
                sender.Id
            );
        }
        else
        {
            // Notify sender that receiver is offline
            await Clients.Caller.SendAsync("ReceiverIsOffline", "User is not available");
        }
    }

    // Send group message to all others
    public async Task SendGroupMessage(string message)
    {
        var connectionId = Context.ConnectionId;

        if (!ConnectedUsers.ContainsKey(connectionId))
            return;

        var sender = ConnectedUsers[connectionId];

        // Send to all EXCEPT the sender
        await Clients.Others.SendAsync("ReceiveGroupMessage", sender.Name, message, connectionId);
    }
}
