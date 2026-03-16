import * as signalR from "@microsoft/signalr"

// Connected user model (matches backend ConnectedUser)
export interface ConnectedUser {
  id: number
  name: string
  connectionId: string
}

export interface GroupMember {
  id: number
  name: string
  connectionId: string
  isAdmin?: boolean
}

// Callback types
type UserListCallback = (users: ConnectedUser[]) => void
type PrivateMessageCallback = (senderName: string, message: string, senderConnectionId: string, senderId: number, messageId: string, sentTime: string) => void
type GroupMessageCallback = (senderName: string, message: string, senderConnectionId: string, messageId: string, groupId: string, sentTime: string) => void
type PrivateMessageDeletedCallback = (messageId: string) => void
type PrivateMessageEditedCallback = (messageId: string, updatedText: string) => void
type GroupMessageDeletedCallback = (messageId: string, groupId: string) => void
type GroupMessageEditedCallback = (messageId: string, updatedText: string, groupId: string) => void
type GroupCreatedCallback = (groupId: string, groupName: string, description: string | null, members: GroupMember[], adminId: number) => void

// Callback registries — these persist across connection rebuilds (StrictMode safe)
const callbacks = {
  userList: new Set<UserListCallback>(),
  privateMessage: new Set<PrivateMessageCallback>(),
  groupMessage: new Set<GroupMessageCallback>(),
  privateMessageDeleted: new Set<PrivateMessageDeletedCallback>(),
  privateMessageEdited: new Set<PrivateMessageEditedCallback>(),
  groupMessageDeleted: new Set<GroupMessageDeletedCallback>(),
  groupMessageEdited: new Set<GroupMessageEditedCallback>(),
  groupCreated: new Set<GroupCreatedCallback>(),
}

let connection: signalR.HubConnection | null = null
let isConnected = false
let attemptId = 0 // Prevents zombie retries from StrictMode race conditions

// Build and start connection, passing userId & name via query string
export const startConnection = async (userId: string, userName: string) => {
  const myAttempt = ++attemptId

  // Stop any existing connection first (prevents duplicates from StrictMode)
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
    try { await connection.stop() } catch {}
  }

  // If another call to startConnection happened while we were stopping, bail out
  if (myAttempt !== attemptId) return

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`http://localhost:5000/hubs/chat?userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(userName)}`, {
      skipNegotiation: false,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect([0, 0, 1000, 3000, 5000, 10000])
    .withHubProtocol(new signalR.JsonHubProtocol())
    .build()

  // Register ALL event forwarders on the new connection BEFORE .start()
  // so we never miss events from OnConnectedAsync
  connection.on("UserList", (users: ConnectedUser[]) => {
    callbacks.userList.forEach(cb => cb(users))
  })

  connection.on("ReceivePrivateMessage", (senderName: string, message: string, senderConnectionId: string, senderId: number, messageId: string, sentTime: string) => {
    callbacks.privateMessage.forEach(cb => cb(senderName, message, senderConnectionId, senderId, messageId, sentTime))
  })

  connection.on("PrivateMessageDeleted", (messageId: string) => {
    callbacks.privateMessageDeleted.forEach(cb => cb(messageId))
  })

  connection.on("PrivateMessageEdited", (messageId: string, updatedText: string) => {
    callbacks.privateMessageEdited.forEach(cb => cb(messageId, updatedText))
  })

  connection.on("ReceiveGroupMessage", (senderName: string, message: string, senderConnectionId: string, messageId: string, groupId: string, sentTime: string) => {
    callbacks.groupMessage.forEach(cb => cb(senderName, message, senderConnectionId, messageId, groupId, sentTime))
  })

  connection.on("GroupMessageDeleted", (messageId: string, groupId: string) => {
    callbacks.groupMessageDeleted.forEach(cb => cb(messageId, groupId))
  })

  connection.on("GroupMessageEdited", (messageId: string, updatedText: string, groupId: string) => {
    callbacks.groupMessageEdited.forEach(cb => cb(messageId, updatedText, groupId))
  })

  connection.on("GroupCreated", (groupId: string, groupName: string, description: string | null, members: GroupMember[], adminId: number) => {
    callbacks.groupCreated.forEach(cb => cb(groupId, groupName, description, members, adminId))
  })

  connection.onreconnecting(() => {
    // console.log("Reconnecting to SignalR hub...")
    isConnected = false
  })

  connection.onreconnected(() => {
    // console.log("Reconnected to SignalR hub")
    isConnected = true
  })

  connection.onclose(() => {
    // console.log("Connection closed")
    isConnected = false
  })

  try {
    await connection.start()
    // If superseded by a newer attempt, stop this connection and bail
    if (myAttempt !== attemptId) {
      try { await connection.stop() } catch {}
      return
    }
    isConnected = true
    // console.log("Connected to SignalR hub")
  } catch (err) {
    // Only retry if this is still the latest attempt
    if (myAttempt !== attemptId) return
    // console.error("SignalR connection error:", err)
    isConnected = false
    setTimeout(() => startConnection(userId, userName), 5000)
  }
}

// Stop connection
export const stopConnection = async () => {
  attemptId++ // Invalidate any pending retry from a previous startConnection
  try {
    if (connection) {
      await connection.stop()
    }
    isConnected = false
  } catch (err) {
    // console.error("Error disconnecting:", err)
  }
}

// Get connection status
export const isConnectionActive = () =>
  isConnected && connection !== null && connection.state === signalR.HubConnectionState.Connected

// ===== SEND MESSAGE METHODS =====

// Send private message using receiver's connectionId
export const sendPrivateMessage = async (message: string, receiverConnectionId: string, messageId: string, sentTime: string) => {
  try {
    if (!isConnectionActive() || !connection) {
      // console.error("Not connected to hub")
      return
    }
    await connection.invoke("SendPrivateMessage", message, receiverConnectionId, messageId, sentTime)
  } catch (err) {
    // console.error("Error sending private message:", err)
  }
}

export const deletePrivateMessage = async (receiverConnectionId: string, messageId: string) => {
  try {
    if (!isConnectionActive() || !connection) {
      return
    }
    await connection.invoke("DeletePrivateMessage", receiverConnectionId, messageId)
  } catch (err) {
    // console.error("Error deleting private message:", err)
  }
}

export const editPrivateMessage = async (receiverConnectionId: string, messageId: string, updatedText: string) => {
  try {
    if (!isConnectionActive() || !connection) {
      return
    }
    await connection.invoke("EditPrivateMessage", receiverConnectionId, messageId, updatedText)
  } catch (err) {
    // console.error("Error editing private message:", err)
  }
}

// Send group message to all others
export const sendGroupMessage = async (groupId: string, message: string, messageId: string, sentTime: string) => {
  try {
    if (!isConnectionActive() || !connection) {
      // console.error("Not connected to hub")
      return
    }
    await connection.invoke("SendGroupMessage", groupId, message, messageId, sentTime)
  } catch (err) {
    // console.error("Error sending group message:", err)
  }
}

export const deleteGroupMessage = async (groupId: string, messageId: string) => {
  try {
    if (!isConnectionActive() || !connection) {
      return
    }
    await connection.invoke("DeleteGroupMessage", groupId, messageId)
  } catch (err) {
    // console.error("Error deleting group message:", err)
  }
}

export const editGroupMessage = async (groupId: string, messageId: string, updatedText: string) => {
  try {
    if (!isConnectionActive() || !connection) {
      return
    }
    await connection.invoke("EditGroupMessage", groupId, messageId, updatedText)
  } catch (err) {
    // console.error("Error editing group message:", err)
  }
}

export const joinGroupChat = async (groupId: string) => {
  try {
    if (!isConnectionActive() || !connection) {
      return
    }
    await connection.invoke("JoinGroupChat", groupId)
  } catch (err) {
    // console.error("Error joining group chat:", err)
  }
}

export const leaveGroupChat = async (groupId: string) => {
  try {
    if (!isConnectionActive() || !connection) {
      return
    }
    await connection.invoke("LeaveGroupChat", groupId)
  } catch (err) {
    // console.error("Error leaving group chat:", err)
  }
}

// ===== SUBSCRIBE / UNSUBSCRIBE =====
// Components call these to register callbacks. Returns an unsubscribe function.
// Callbacks survive connection rebuilds — the forwarders above dispatch to them.

export const onUserList = (cb: UserListCallback) => {
  callbacks.userList.add(cb)
  return () => { callbacks.userList.delete(cb) }
}

export const onReceivePrivateMessage = (cb: PrivateMessageCallback) => {
  callbacks.privateMessage.add(cb)
  return () => { callbacks.privateMessage.delete(cb) }
}

export const onPrivateMessageDeleted = (cb: PrivateMessageDeletedCallback) => {
  callbacks.privateMessageDeleted.add(cb)
  return () => { callbacks.privateMessageDeleted.delete(cb) }
}

export const onPrivateMessageEdited = (cb: PrivateMessageEditedCallback) => {
  callbacks.privateMessageEdited.add(cb)
  return () => { callbacks.privateMessageEdited.delete(cb) }
}

export const onReceiveGroupMessage = (cb: GroupMessageCallback) => {
  callbacks.groupMessage.add(cb)
  return () => { callbacks.groupMessage.delete(cb) }
}

export const onGroupMessageDeleted = (cb: GroupMessageDeletedCallback) => {
  callbacks.groupMessageDeleted.add(cb)
  return () => { callbacks.groupMessageDeleted.delete(cb) }
}

export const onGroupMessageEdited = (cb: GroupMessageEditedCallback) => {
  callbacks.groupMessageEdited.add(cb)
  return () => { callbacks.groupMessageEdited.delete(cb) }
}

export const createGroupChat = async (groupId: string, groupName: string, description: string | undefined, memberIds: number[], adminId: number) => {
  try {
    if (!isConnectionActive() || !connection) {
      return
    }
    await connection.invoke("CreateGroupChat", groupId, groupName, description ?? null, memberIds, adminId)
  } catch (err) {
    // console.error("Error creating group chat:", err)
  }
}

export const onGroupCreated = (cb: GroupCreatedCallback) => {
  callbacks.groupCreated.add(cb)
  return () => { callbacks.groupCreated.delete(cb) }
}