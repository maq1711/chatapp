import { Input, Button, Dropdown } from "antd";
import { SendOutlined, MoreOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState, useRef, useEffect } from "react";
import type { MenuProps } from "antd";
import "./Chat.css";

interface Message {
  id: number;
  text: string;
  sender: "me" | "other";
  time: string;
}

interface User {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
}

interface ChatProps {
  selectedUser: User | null;
}

// Helper function to get current time
const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Mock chat history for each user
const chatHistory: Record<number, Message[]> = {
  1: [ // Ali
    { id: 1, text: "Hello bro", sender: "other", time: "10:25" },
    { id: 2, text: "Hi Ali! How are you?", sender: "me", time: "10:26" },
    { id: 3, text: "I'm good, thanks!", sender: "other", time: "10:27" },
  ],
  2: [ // Ahmed
    { id: 1, text: "Meeting at 5", sender: "other", time: "09:15" },
    { id: 2, text: "Sure, I'll be there", sender: "me", time: "09:16" },
    { id: 3, text: "Great! See you then", sender: "other", time: "09:20" },
  ],
  3: [ // Sara
    { id: 1, text: "Can you help me with the project?", sender: "other", time: "Yesterday" },
    { id: 2, text: "Of course! What do you need?", sender: "me", time: "Yesterday" },
    { id: 3, text: "Okay 👍", sender: "other", time: "Yesterday" },
  ],
};

export default function Chat({ selectedUser }: ChatProps) {

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      setMessages(chatHistory[selectedUser.id] || []);
    }
  }, [selectedUser]);

  const sendMessage = () => {

    if (!message.trim() || !selectedUser) return;

    const newMessage: Message = { 
      id: Date.now(), 
      text: message, 
      sender: "me",
      time: getCurrentTime()
    };
    const updatedMessages = [...messages, newMessage];
    
    setMessages(updatedMessages);
    chatHistory[selectedUser.id] = updatedMessages;
    setMessage("");
  };

  const handleEdit = (msgId: number) => {
    const messageToEdit = messages.find(m => m.id === msgId);
    if (messageToEdit) {
      setEditingMessageId(msgId);
      setEditText(messageToEdit.text);
    }
  };

  const saveEdit = (msgId: number) => {
    if (!editText.trim()) return;
    
    const updatedMessages = messages.map(m => 
      m.id === msgId ? { ...m, text: editText } : m
    );
    
    setMessages(updatedMessages);
    if (selectedUser) {
      chatHistory[selectedUser.id] = updatedMessages;
    }
    setEditingMessageId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleDelete = (msgId: number) => {
    const updatedMessages = messages.filter(m => m.id !== msgId);
    setMessages(updatedMessages);
    if (selectedUser) {
      chatHistory[selectedUser.id] = updatedMessages;
    }
  };

  const getMenuItems = (msgId: number): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => handleEdit(msgId),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(msgId),
    },
  ];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">

      {/* Chat header */}
      <div className="chat-header">
        {selectedUser ? selectedUser.name : "Select a chat"}
      </div>

      {/* Messages */}
      <div className="chat-messages">

        {!selectedUser ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "var(--color-gray-text)",
            fontSize: "16px",
            textAlign: "center",
            flexDirection: "column",
            gap: "10px"
          }}>
            <div style={{ fontSize: "48px" }}>💬</div>
            <div>Select a chat from the sidebar to start messaging</div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-wrapper ${msg.sender === "me" ? "sent" : "received"}`}
              >
                {editingMessageId === msg.id ? (
                  <div className={`message-bubble editing ${msg.sender === "me" ? "sent" : "received"}`}>
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onPressEnter={() => saveEdit(msg.id)}
                      autoFocus
                      className="edit-input"
                    />
                    <div className="edit-actions">
                      <Button size="small" type="primary" onClick={() => saveEdit(msg.id)}>Save</Button>
                      <Button size="small" onClick={cancelEdit}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`message-bubble ${msg.sender === "me" ? "sent" : "received"}`}>
                      <span className="message-text">{msg.text}</span>
                      {msg.sender === "me" && (
                        <Dropdown menu={{ items: getMenuItems(msg.id) }} trigger={['click']} placement="bottomRight">
                          <Button 
                            type="text" 
                            icon={<MoreOutlined />} 
                            className="message-menu-btn"
                            size="small"
                          />
                        </Dropdown>
                      )}
                    </div>
                    <span className="message-time">{msg.time}</span>
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} className="messages-end-ref" />
          </>
        )}

      </div>

      {/* Message input */}
      <div className="chat-input-container">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={selectedUser ? "Type message" : "Select a chat first"}
          onPressEnter={sendMessage}
          disabled={!selectedUser}
        />

        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={sendMessage}
          disabled={!selectedUser}
        />
      </div>

    </div>
  );
}