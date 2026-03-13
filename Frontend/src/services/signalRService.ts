import * as signalR from "@microsoft/signalr"

// Create the SignalR connection
const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5000/hubs/chat", {
    skipNegotiation: false,
    transport: signalR.HttpTransportType.WebSockets,
  })
  .withAutomaticReconnect([0, 0, 1000, 3000, 5000, 10000])
  .withHubProtocol(new signalR.JsonHubProtocol())
  .build()

// Connection state management
let isConnected = false

// Start connection
export const startConnection = async () => {
  try {
    if (connection.state === signalR.HubConnectionState.Disconnected) {
      await connection.start()
      isConnected = true
      console.log("✅ Connected to SignalR hub")
    }
  } catch (err) {
    console.error("❌ SignalR connection error:", err)
    isConnected = false
    setTimeout(() => startConnection(), 5000) // Retry after 5 seconds
  }
}

// Stop connection
export const stopConnection = async () => {
  try {
    await connection.stop()
    isConnected = false
    console.log("🔴 Disconnected from SignalR hub")
  } catch (err) {
    console.error("❌ Error disconnecting:", err)
  }
}

// Get connection status
export const isConnectionActive = () => isConnected && connection.state === signalR.HubConnectionState.Connected

// ===== SEND MESSAGE METHODS =====

// Send private message to specific user
export const sendPrivateMessage = async (receiverId: string, message: string, senderName: string) => {
  try {
    if (!isConnectionActive()) {
      console.error("❌ Not connected to hub")
      return
    }
    await connection.invoke("SendPrivateMessage", receiverId, message, senderName)
    console.log(`📤 Private message sent to ${receiverId}: ${message}`)
  } catch (err) {
    console.error("❌ Error sending private message:", err)
  }
}

// Send message to group
export const sendGroupMessage = async (groupName: string, message: string, senderName: string) => {
  try {
    if (!isConnectionActive()) {
      console.error("❌ Not connected to hub")
      return
    }
    await connection.invoke("SendGroupMessage", groupName, message, senderName)
    console.log(`📤 Group message sent to ${groupName}: ${message}`)
  } catch (err) {
    console.error("❌ Error sending group message:", err)
  }
}

// Join a group
export const joinGroup = async (groupName: string, userName: string) => {
  try {
    if (!isConnectionActive()) {
      console.error("❌ Not connected to hub")
      return
    }
    await connection.invoke("JoinGroup", groupName, userName)
    console.log(`👤 Joined group: ${groupName}`)
  } catch (err) {
    console.error("❌ Error joining group:", err)
  }
}

// Leave a group
export const leaveGroup = async (groupName: string, userName: string) => {
  try {
    if (!isConnectionActive()) {
      console.error("❌ Not connected to hub")
      return
    }
    await connection.invoke("LeaveGroup", groupName, userName)
    console.log(`👤 Left group: ${groupName}`)
  } catch (err) {
    console.error("❌ Error leaving group:", err)
  }
}

// Join website lobby
export const joinWebsite = async (userId: string, userName: string) => {
  try {
    if (!isConnectionActive()) {
      console.error("❌ Not connected to hub")
      return
    }
    await connection.invoke("JoinWebsite", userId, userName)
    console.log(`👤 Joined website`)
  } catch (err) {
    console.error("❌ Error joining website:", err)
  }
}

// ===== RECEIVE MESSAGE METHODS =====

// Listen for private messages
export const onReceivePrivateMessage = (callback: (senderName: string, message: string) => void) => {
  connection.on("ReceivePrivateMessage", (senderName: string, message: string) => {
    console.log(`📥 Private message from ${senderName}: ${message}`)
    callback(senderName, message)
  })
}

// Listen for group messages
export const onReceiveGroupMessage = (callback: (senderName: string, message: string) => void) => {
  connection.on("ReceiveGroupMessage", (senderName: string, message: string) => {
    console.log(`📥 Group message from ${senderName}: ${message}`)
    callback(senderName, message)
  })
}

// Listen for user joined notification
export const onUserJoined = (callback: (userName: string) => void) => {
  connection.on("UserJoined", (userName: string) => {
    console.log(`✅ User joined: ${userName}`)
    callback(userName)
  })
}

// Listen for user joined group notification
export const onUserJoinedGroup = (callback: (userName: string, groupName: string) => void) => {
  connection.on("UserJoinedGroup", (userName: string, groupName: string) => {
    console.log(`✅ ${userName} joined group: ${groupName}`)
    callback(userName, groupName)
  })
}

// Listen for user left group notification
export const onUserLeftGroup = (callback: (userName: string, groupName: string) => void) => {
  connection.on("UserLeftGroup", (userName: string, groupName: string) => {
    console.log(`❌ ${userName} left group: ${groupName}`)
    callback(userName, groupName)
  })
}

// Connection state change handlers
connection.onreconnecting(() => {
  console.log("🔄 Reconnecting to SignalR hub...")
  isConnected = false
})

connection.onreconnected(() => {
  console.log("✅ Reconnected to SignalR hub")
  isConnected = true
})

connection.onclose(() => {
  console.log("🔴 Connection closed")
  isConnected = false
})

export default connection