import { Input, Button, Dropdown, Avatar, Tag } from "antd";
import { SendOutlined, MoreOutlined, EditOutlined, DeleteOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import { useState, useRef, useEffect } from "react";
import type { MenuProps } from "antd";
import {
  sendPrivateMessage,
  deletePrivateMessage,
  editPrivateMessage,
  sendGroupMessage,
  deleteGroupMessage,
  editGroupMessage,
  joinGroupChat,
  leaveGroupChat,
  onReceivePrivateMessage,
  onPrivateMessageDeleted,
  onPrivateMessageEdited,
  onReceiveGroupMessage,
  onGroupMessageDeleted,
  onGroupMessageEdited,
  isConnectionActive,
} from "../../../services/signalRService";
import "./Chat.css";

const { TextArea } = Input;

interface Message {
  id: number;
  sharedId?: string;
  text: string;
  sender: "me" | "other";
  time: string;
  senderName?: string;
  isDeleted?: boolean;
  isEdited?: boolean;
}

interface User {
  id: number;
  name: string;
  connectionId: string;
  lastMessage: string;
  time: string;
  isOnline?: boolean;
}

interface Group {
  id: number;
  name: string;
  description?: string;
  lastMessage: string;
  time: string;
  members: User[];
  createdAt: Date;
}

interface ChatProps {
  selectedUser?: User | null;
  selectedGroup?: Group | null;
  chatType?: 'user' | 'group';
  onUserPreviewUpdate?: (userId: number, lastMessage: string, time: string) => void;
  onOpenGroupInfo?: (group: Group) => void;
}

// Helper function to get current time
const getCurrentTime = () => {
  const now = new Date();
  const time = now.toLocaleTimeString("en-PK", {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return time.replace("AM", "am").replace("PM", "pm");
};

const LINK_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const LONG_MESSAGE_THRESHOLD = 280;

const isLongMessage = (text: string) => text.trim().length > LONG_MESSAGE_THRESHOLD;

const getCollapsedMessage = (text: string) => {
  if (!isLongMessage(text)) return text;
  return `${text.slice(0, LONG_MESSAGE_THRESHOLD).trimEnd()}...`;
};

const DELETED_MESSAGE_TEXT = "Message deleted by user...";

const generateMessageId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const renderMessageContent = (text: string) => {
  const parts = text.split(LINK_REGEX);
  return parts.map((part, idx) => {
    const isLink = /^https?:\/\//i.test(part) || /^www\./i.test(part);
    if (!isLink) return <span key={`text-${idx}`}>{part}</span>;

    const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;
    return (
      <a
        key={`link-${idx}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="message-link"
      >
        {part}
      </a>
    );
  });
};

// Chat history stored per user/group id
const chatHistory: Record<number, Message[]> = {};

export default function Chat({ selectedUser, selectedGroup, chatType = 'user', onUserPreviewUpdate, onOpenGroupInfo }: ChatProps) {

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeGroupIdRef = useRef<string | null>(null);

  // Get current logged-in user info
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const myName = currentUser?.fullName || "Me";

  // Determine current chat ID and name
  const currentChatId = chatType === 'group' ? selectedGroup?.id : selectedUser?.id;
  const isGroupChat = chatType === 'group';

  // Load messages when user or group is selected
  useEffect(() => {
    if (currentChatId) {
      setMessages(chatHistory[currentChatId] || []);
      setExpandedMessages({});
    }
  }, [currentChatId]);

  useEffect(() => {
    const nextGroupId = isGroupChat && selectedGroup ? String(selectedGroup.id) : null;
    const prevGroupId = activeGroupIdRef.current;

    const updateGroupMembership = async () => {
      if (prevGroupId && prevGroupId !== nextGroupId) {
        await leaveGroupChat(prevGroupId);
      }

      if (nextGroupId && prevGroupId !== nextGroupId) {
        await joinGroupChat(nextGroupId);
      }
    };

    void updateGroupMembership();
    activeGroupIdRef.current = nextGroupId;

    return () => {
      if (nextGroupId) {
        void leaveGroupChat(nextGroupId);
      }
    };
  }, [isGroupChat, selectedGroup?.id]);

  const toggleExpandedMessage = (msgId: number) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const syncPrivatePreviewFromMessages = (updatedMessages: Message[]) => {
    if (isGroupChat || !selectedUser) return;
    if (updatedMessages.length === 0) {
      onUserPreviewUpdate?.(selectedUser.id, "No messages yet", "");
      return;
    }
    const latest = updatedMessages[updatedMessages.length - 1];
    onUserPreviewUpdate?.(selectedUser.id, latest.text, latest.time);
  };

  // Listen for incoming SignalR messages via callback registry (StrictMode safe)
  useEffect(() => {
    const unsubPrivate = onReceivePrivateMessage((senderName, text, senderConnectionId, senderId, messageId, sentTime) => {
      const messageTime = sentTime || getCurrentTime();
      const privateChatId = senderId;
      const incoming: Message = {
        id: Date.now(),
        sharedId: messageId,
        text,
        sender: "other",
        time: messageTime,
        senderName,
      };
      const existing = chatHistory[privateChatId] || [];
      const updated = [...existing, incoming];
      chatHistory[privateChatId] = updated;
      if (!isGroupChat && currentChatId === privateChatId) {
        setMessages(updated);
      }

      if (senderId) {
        onUserPreviewUpdate?.(senderId, text, messageTime);
      }
    });

    const unsubDeleted = onPrivateMessageDeleted((messageId) => {
      Object.keys(chatHistory).forEach((key) => {
        const conversationId = Number(key);
        chatHistory[conversationId] = (chatHistory[conversationId] || []).map((m) =>
          m.sharedId === messageId
            ? { ...m, text: DELETED_MESSAGE_TEXT, isDeleted: true, isEdited: false }
            : m
        );
      });

      if (currentChatId) {
        const updatedCurrent = chatHistory[currentChatId] || [];
        setMessages(updatedCurrent);
        if (!isGroupChat) {
          syncPrivatePreviewFromMessages(updatedCurrent);
        }
      }
    });

    const unsubPrivateEdited = onPrivateMessageEdited((messageId, updatedText) => {
      Object.keys(chatHistory).forEach((key) => {
        const conversationId = Number(key);
        chatHistory[conversationId] = (chatHistory[conversationId] || []).map((m) =>
          m.sharedId === messageId
            ? { ...m, text: updatedText, isEdited: true }
            : m
        );
      });

      if (currentChatId) {
        const updatedCurrent = chatHistory[currentChatId] || [];
        setMessages(updatedCurrent);
        if (!isGroupChat) {
          syncPrivatePreviewFromMessages(updatedCurrent);
        }
      }
    });

    const unsubGroup = onReceiveGroupMessage((senderName, text, senderConnectionId, messageId, groupId, sentTime) => {
      const groupChatId = Number(groupId);
      const existing = chatHistory[groupChatId] || [];
      // Skip if message already added (avoid duplicates)
      if (existing.some(m => m.sharedId === messageId)) return;
      const incoming: Message = {
        id: Date.now(),
        sharedId: messageId,
        text,
        sender: senderName === myName ? "me" : "other",
        time: sentTime || getCurrentTime(),
        senderName: senderName === myName ? undefined : senderName,
      };
      const updated = [...existing, incoming];
      chatHistory[groupChatId] = updated;
      if (isGroupChat && currentChatId === groupChatId) {
        setMessages(updated);
      }
    });

    const unsubGroupDeleted = onGroupMessageDeleted((messageId, groupId) => {
      const groupChatId = Number(groupId);
      const updated = (chatHistory[groupChatId] || []).map((m) =>
          m.sharedId === messageId
            ? { ...m, text: DELETED_MESSAGE_TEXT, isDeleted: true, isEdited: false }
            : m
      );
      chatHistory[groupChatId] = updated;
      if (isGroupChat && currentChatId === groupChatId) {
        setMessages(updated);
      }
    });

    const unsubGroupEdited = onGroupMessageEdited((messageId, updatedText, groupId) => {
      const groupChatId = Number(groupId);
      const updated = (chatHistory[groupChatId] || []).map((m) =>
          m.sharedId === messageId
            ? { ...m, text: updatedText, isEdited: true }
            : m
      );
      chatHistory[groupChatId] = updated;
      if (isGroupChat && currentChatId === groupChatId) {
        setMessages(updated);
      }
    });

    return () => {
      unsubPrivate();
      unsubDeleted();
      unsubPrivateEdited();
      unsubGroup();
      unsubGroupDeleted();
      unsubGroupEdited();
    };
  }, [currentChatId, myName, isGroupChat, selectedUser?.id]);

  const sendMessage = async () => {
    if (!message.trim() || !currentChatId) return;

    const newMessage: Message = { 
      id: Date.now(), 
      sharedId: generateMessageId(),
      text: message, 
      sender: "me",
      time: getCurrentTime()
    };
    const updatedMessages = [...messages, newMessage];
    
    setMessages(updatedMessages);
    chatHistory[currentChatId] = updatedMessages;

    // Send via SignalR if connected
    if (isConnectionActive()) {
      if (isGroupChat && selectedGroup) {
        await sendGroupMessage(String(selectedGroup.id), message, newMessage.sharedId || generateMessageId(), newMessage.time);
      } else if (selectedUser) {
        await sendPrivateMessage(message, selectedUser.connectionId, newMessage.sharedId || generateMessageId(), newMessage.time);
        onUserPreviewUpdate?.(selectedUser.id, message, newMessage.time);
      }
    }

    setMessage("");
  };

  const handleEdit = (msgId: number) => {
    const messageToEdit = messages.find(m => m.id === msgId);
    if (messageToEdit) {
      setEditingMessageId(msgId);
      setEditText(messageToEdit.text);
    }
  };

  const saveEdit = async (msgId: number) => {
    if (!editText.trim()) return;
    const target = messages.find((m) => m.id === msgId);
    if (!target) return;
    
    const updatedMessages = messages.map(m => 
      m.id === msgId ? { ...m, text: editText, isEdited: true } : m
    );
    
    setMessages(updatedMessages);
    if (currentChatId) {
      chatHistory[currentChatId] = updatedMessages;
    }
    syncPrivatePreviewFromMessages(updatedMessages);
    setEditingMessageId(null);
    setEditText("");

    if (!target.sharedId || !isConnectionActive()) return;

    if (!isGroupChat && selectedUser) {
      await editPrivateMessage(selectedUser.connectionId, target.sharedId, editText);
      return;
    }

    if (isGroupChat) {
      await editGroupMessage(String(selectedGroup?.id || ""), target.sharedId, editText);
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleDelete = async (msgId: number) => {
    const target = messages.find((m) => m.id === msgId);
    if (!target) return;

    const updatedMessages = messages.map((m) =>
      m.id === msgId
        ? { ...m, text: DELETED_MESSAGE_TEXT, isDeleted: true, isEdited: false }
        : m
    );

    setMessages(updatedMessages);
    if (currentChatId) {
      chatHistory[currentChatId] = updatedMessages;
    }
    syncPrivatePreviewFromMessages(updatedMessages);
    setExpandedMessages((prev) => {
      const next = { ...prev };
      delete next[msgId];
      return next;
    });

    if (!isGroupChat && selectedUser && target.sharedId && isConnectionActive()) {
      await deletePrivateMessage(selectedUser.connectionId, target.sharedId);
      return;
    }

    if (isGroupChat && target.sharedId && isConnectionActive()) {
      await deleteGroupMessage(String(selectedGroup?.id || ""), target.sharedId);
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

      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          {isGroupChat && selectedGroup ? (
            <>
              <Avatar 
                style={{ backgroundColor: '#52c41a' }}
                icon={<UsergroupAddOutlined />}
              />
              <button
                type="button"
                className="group-info-trigger"
                onClick={() => onOpenGroupInfo?.(selectedGroup)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{selectedGroup.name}</span>
                  <Tag color="green">{selectedGroup.members.length} members</Tag>
                </div>
                {selectedGroup.description && (
                  <div style={{ fontSize: '12px', color: 'var(--color-gray-text)' }}>
                    {selectedGroup.description}
                  </div>
                )}
              </button>
            </>
          ) : selectedUser ? (
            <span>{selectedUser.name}</span>
          ) : (
            <span>Select a chat</span>
          )}
        </div>
      </div>

      <div className="chat-messages">

        {!selectedUser && !selectedGroup ? (
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
                    <TextArea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoSize={{ minRows: 1, maxRows: 6 }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          saveEdit(msg.id);
                        }
                      }}
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
                    {isGroupChat && msg.sender === "other" && msg.senderName && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: 'var(--color-primary)',
                        marginBottom: '2px',
                        fontWeight: 500
                      }}>
                        {msg.senderName}
                      </div>
                    )}
                    <div className={`message-bubble ${msg.sender === "me" ? "sent" : "received"}`}>
                      <span className="message-text">
                        {renderMessageContent(
                          isLongMessage(msg.text) && !expandedMessages[msg.id]
                            ? getCollapsedMessage(msg.text)
                            : msg.text
                        )}
                        {isLongMessage(msg.text) && !msg.isDeleted && (
                          <button
                            type="button"
                            className="message-expand-btn"
                            onClick={() => toggleExpandedMessage(msg.id)}
                          >
                            {expandedMessages[msg.id] ? "Show less" : "See more"}
                          </button>
                        )}
                      </span>
                      {msg.sender === "me" && !msg.isDeleted && (
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
                    
                    <span className="message-time">{msg.time}{msg.isEdited ? " · edited" : ""}</span>
                  </>
                )}
                
              </div>
              
            ))}
            
            <div ref={messagesEndRef} className="messages-end-ref" />

          </>
          
        )}

      </div>

      <div className="chat-input-container">
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isGroupChat && selectedGroup ? `Message ${selectedGroup.name}...` : selectedUser ? `Message ${selectedUser.name}...` : "Select a chat first"}
          autoSize={{ minRows: 1, maxRows: 4 }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendMessage();
            }
          }}
          disabled={!selectedUser && !selectedGroup}
        />

        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={sendMessage}
          disabled={!selectedUser && !selectedGroup}
        />
      </div>

    </div>
  );
}