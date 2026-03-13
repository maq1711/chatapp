import * as signalR from "@microsoft/signalr"

// Connected user model (matches backend ConnectedUser)
export interface ConnectedUser {
  id: number
  name: string
  connectionId: string
}

// Callback types
type UserListCallback = (users: ConnectedUser[]) => void
type PrivateMessageCallback = (senderName: string, message: string, senderConnectionId: string, senderId: number) => void
type GroupMessageCallback = (senderName: string, message: string, senderConnectionId: string) => void

// Callback registries — these persist across connection rebuilds (StrictMode safe)
const callbacks = {
  userList: new Set<UserListCallback>(),
  privateMessage: new Set<PrivateMessageCallback>(),
  groupMessage: new Set<GroupMessageCallback>(),
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

  connection.on("ReceivePrivateMessage", (senderName: string, message: string, senderConnectionId: string, senderId: number) => {
    callbacks.privateMessage.forEach(cb => cb(senderName, message, senderConnectionId, senderId))
  })

  connection.on("ReceiveGroupMessage", (senderName: string, message: string, senderConnectionId: string) => {
    callbacks.groupMessage.forEach(cb => cb(senderName, message, senderConnectionId))
  })

  connection.onreconnecting(() => {
    console.log("Reconnecting to SignalR hub...")
    isConnected = false
  })

  connection.onreconnected(() => {
    console.log("Reconnected to SignalR hub")
    isConnected = true
  })

  connection.onclose(() => {
    console.log("Connection closed")
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
    console.log("Connected to SignalR hub")
  } catch (err) {
    // Only retry if this is still the latest attempt
    if (myAttempt !== attemptId) return
    console.error("SignalR connection error:", err)
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
    console.error("Error disconnecting:", err)
  }
}

// Get connection status
export const isConnectionActive = () =>
  isConnected && connection !== null && connection.state === signalR.HubConnectionState.Connected

// ===== SEND MESSAGE METHODS =====

// Send private message using receiver's connectionId
export const sendPrivateMessage = async (message: string, receiverConnectionId: string) => {
  try {
    if (!isConnectionActive() || !connection) {
      console.error("Not connected to hub")
      return
    }
    await connection.invoke("SendPrivateMessage", message, receiverConnectionId)
  } catch (err) {
    console.error("Error sending private message:", err)
  }
}

// Send group message to all others
export const sendGroupMessage = async (message: string) => {
  try {
    if (!isConnectionActive() || !connection) {
      console.error("Not connected to hub")
      return
    }
    await connection.invoke("SendGroupMessage", message)
  } catch (err) {
    console.error("Error sending group message:", err)
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

export const onReceiveGroupMessage = (cb: GroupMessageCallback) => {
  callbacks.groupMessage.add(cb)
  return () => { callbacks.groupMessage.delete(cb) }
}