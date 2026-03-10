import { useState } from "react";
import { List, Avatar, Input } from "antd";
import "./ChatSidebar.css";

interface User {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
}

const users: User[] = [
  { id: 1, name: "Ali", lastMessage: "Hello bro", time: "10:30" },
  { id: 2, name: "Ahmed", lastMessage: "Meeting at 5", time: "09:20" },
  { id: 3, name: "Sara", lastMessage: "Okay 👍", time: "Yesterday" },
];

interface ChatSidebarProps {
  onSelectUser: (user: User) => void;
  selectedUserId?: number;
}

export default function ChatSidebar({ onSelectUser, selectedUserId }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter users based on search query (minimum 2 characters)
  const filteredUsers = searchQuery.length >= 2
    ? users.filter((user) => {
        const query = searchQuery.toLowerCase();
        const nameMatch = user.name.toLowerCase().includes(query);
        const messageMatch = user.lastMessage.toLowerCase().includes(query);
        return nameMatch || messageMatch;
      })
    : users;

  return (
    <div className="chat-sidebar">

      {/* Header */}
      <div className="sidebar-header">
        Chats
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <Input 
          placeholder="Search chat..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
      </div>

      {/* Chat List */}
      <List
        className="chat-list"
        dataSource={filteredUsers}
        locale={{ emptyText: searchQuery.length >= 2 ? "No chats found" : "No chats" }}
        renderItem={(user) => (
          <List.Item
            className={`chat-list-item ${selectedUserId === user.id ? 'active' : ''}`}
            style={{
              padding: 0,
            }}
            onClick={() => onSelectUser(user)}
          >
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '8px 12px', gap: '12px' }}>
              <Avatar>{user.name[0]}</Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="list-item-title">{user.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span className="list-item-description" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.lastMessage}</span>
                  <span className="list-item-time">{user.time}</span>
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}