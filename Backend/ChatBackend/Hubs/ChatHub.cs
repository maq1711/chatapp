using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace ChatBackend.Hubs;

public class ConnectedUser
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ConnectionId { get; set; } = string.Empty;
}

public class GroupMemberInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ConnectionId { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
}

public class ChatHub : Hub
{
    // Static dictionary: connectionId -> user info
    private static readonly ConcurrentDictionary<string, ConnectedUser> ConnectedUsers = new();

    // When a user connects: read name & userId from query string, store in dictionary, broadcast user list
    public override async Task OnConnectedAsync()
    {
        var name = Context.GetHttpContext()?.Request.Query["name"].ToString() ?? "";
        var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString() ?? "0";
        var connectionId = Context.ConnectionId;
        var parsedUserId = int.TryParse(userId, out var id) ? id : 0;

        if (parsedUserId <= 0 || string.IsNullOrWhiteSpace(name))
        {
            Context.Abort();
            return;
        }

        var user = new ConnectedUser
        {
            Id = parsedUserId,
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
            ConnectedUsers.TryRemove(key, out _);
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

        if (ConnectedUsers.TryGetValue(connectionId, out var existingUser))
        {
            disconnectedUser = existingUser;
            ConnectedUsers.TryRemove(connectionId, out _);
        }

        // Notify all clients to remove this user from their list
        if (disconnectedUser != null)
        {
            await Clients.All.SendAsync("RemoveUser", disconnectedUser.Id);
            // Console.WriteLine($"User disconnected: {disconnectedUser.Name} (ID: {disconnectedUser.Id})");
        }

        // Send updated user list
        await Clients.All.SendAsync("UserList", ConnectedUsers.Values.ToArray());

        await base.OnDisconnectedAsync(exception);
    }

    // Send private message using receiver's connectionId
    public async Task SendPrivateMessage(string message, string receiverConnectionId, string messageId, string sentTime)
    {
        var senderConnectionId = Context.ConnectionId;

        if (!ConnectedUsers.TryGetValue(senderConnectionId, out var sender))
            return;

        // Check if receiver is still online
        if (ConnectedUsers.ContainsKey(receiverConnectionId))
        {
            // Send to the specific receiver
            await Clients.Client(receiverConnectionId).SendAsync(
                "ReceivePrivateMessage",
                sender.Name,
                message,
                senderConnectionId,
                sender.Id,
                messageId,
                sentTime
            );
        }
        else
        {
            // Notify sender that receiver is offline
            await Clients.Caller.SendAsync("ReceiverIsOffline", "User is not available");
        }
    }

    // Join a logical chat group (group id string)
    public async Task JoinGroupChat(string groupId)
    {
        if (string.IsNullOrWhiteSpace(groupId))
            return;

        await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
    }

    // Leave a logical chat group (group id string)
    public async Task LeaveGroupChat(string groupId)
    {
        if (string.IsNullOrWhiteSpace(groupId))
            return;

        var connectionId = Context.ConnectionId;
        if (!ConnectedUsers.TryGetValue(connectionId, out var leavingUser))
            return;

        var leaveMessageId = Guid.NewGuid().ToString();
        var sentTime = DateTime.Now.ToString("hh:mm tt").ToLowerInvariant();

        await Clients.OthersInGroup(groupId).SendAsync(
            "ReceiveGroupMessage",
            "System",
            $"{leavingUser.Name} left the group",
            connectionId,
            leaveMessageId,
            groupId,
            sentTime
        );

        await Groups.RemoveFromGroupAsync(connectionId, groupId);
    }

    // Create a chat group and notify all selected members
    public async Task CreateGroupChat(string groupId, string groupName, string? description, int[] memberIds, int adminId)
    {
        var creatorConnectionId = Context.ConnectionId;

        if (!ConnectedUsers.ContainsKey(creatorConnectionId))
            return;

        if (string.IsNullOrWhiteSpace(groupId) || string.IsNullOrWhiteSpace(groupName))
            return;

        var targetMemberIds = (memberIds ?? Array.Empty<int>()).ToHashSet();
        targetMemberIds.Add(adminId);

        var members = ConnectedUsers.Values
            .Where(u => targetMemberIds.Contains(u.Id))
            .GroupBy(u => u.Id)
            .Select(g => g.First())
            .Select(u => new GroupMemberInfo
            {
                Id = u.Id,
                Name = u.Name,
                ConnectionId = u.ConnectionId,
                IsAdmin = u.Id == adminId,
            })
            .ToList();

        var connectionIds = members.Select(m => m.ConnectionId).Distinct().ToList();

        Console.WriteLine($"[CreateGroup] GroupId={groupId}, Name={groupName}, RequestedMembers={string.Join(",", memberIds ?? Array.Empty<int>())}, FoundMembers={string.Join(",", members.Select(m => m.Name))}, Total={members.Count}");
        Console.WriteLine($"[CreateGroup] Total ConnectedUsers={ConnectedUsers.Count}");

        // Ensure all selected members are in this SignalR group channel
        foreach (var connectionId in connectionIds)
        {
            await Groups.AddToGroupAsync(connectionId, groupId);
        }

        // Broadcast to ALL clients (not just connected members) so group appears everywhere
        Console.WriteLine($"[CreateGroup] Broadcasting GroupCreated to all clients");
        await Clients.All.SendAsync(
            "GroupCreated",
            groupId,
            groupName,
            description,
            members,
            adminId
        );
    }

    // Mark a private message as deleted for receiver side as well
    public async Task DeletePrivateMessage(string receiverConnectionId, string messageId)
    {
        var senderConnectionId = Context.ConnectionId;

        if (!ConnectedUsers.ContainsKey(senderConnectionId))
            return;

        if (!ConnectedUsers.ContainsKey(receiverConnectionId))
            return;

        await Clients.Client(receiverConnectionId).SendAsync("PrivateMessageDeleted", messageId);
    }

    // Mark a private message as edited for receiver side as well
    public async Task EditPrivateMessage(string receiverConnectionId, string messageId, string updatedText)
    {
        var senderConnectionId = Context.ConnectionId;

        if (!ConnectedUsers.ContainsKey(senderConnectionId))
            return;

        if (!ConnectedUsers.ContainsKey(receiverConnectionId))
            return;

        await Clients.Client(receiverConnectionId).SendAsync("PrivateMessageEdited", messageId, updatedText);
    }

    // Send group message to all members in the group (including sender for confirmation)
    public async Task SendGroupMessage(string groupId, string message, string messageId, string sentTime)
    {
        var connectionId = Context.ConnectionId;

        if (!ConnectedUsers.TryGetValue(connectionId, out var sender))
            return;

        if (string.IsNullOrWhiteSpace(groupId))
            return;

        // Send to all users in this group including sender for proper sync
        await Clients.Group(groupId).SendAsync("ReceiveGroupMessage", sender.Name, message, connectionId, messageId, groupId, sentTime);
    }

    // Mark a group message as edited for everyone except sender
    public async Task EditGroupMessage(string groupId, string messageId, string updatedText)
    {
        var connectionId = Context.ConnectionId;

        if (!ConnectedUsers.ContainsKey(connectionId))
            return;

        if (string.IsNullOrWhiteSpace(groupId))
            return;

        await Clients.OthersInGroup(groupId).SendAsync("GroupMessageEdited", messageId, updatedText, groupId);
    }

    // Mark a group message as deleted for everyone except sender
    public async Task DeleteGroupMessage(string groupId, string messageId)
    {
        var connectionId = Context.ConnectionId;

        if (!ConnectedUsers.ContainsKey(connectionId))
            return;

        if (string.IsNullOrWhiteSpace(groupId))
            return;

        await Clients.OthersInGroup(groupId).SendAsync("GroupMessageDeleted", messageId, groupId);
    }
}
