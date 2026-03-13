import { useState } from "react";
import { List, Avatar, Input, Tabs, Badge } from "antd";
import { MessageOutlined, UsergroupAddOutlined, LogoutOutlined, UserOutlined, UpOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import GroupManagement from "./GroupManagement";
import "./ChatSidebar.css";

interface User {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
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

const users: User[] = [
  { id: 1, name: "Ali", lastMessage: "Hello bro", time: "10:30" },
  { id: 2, name: "Ahmed", lastMessage: "Meeting at 5", time: "09:20" },
  { id: 3, name: "Sara", lastMessage: "Okay 👍", time: "Yesterday" },
];

interface ChatSidebarProps {
  onSelectUser: (user: User) => void;
  onSelectGroup?: (group: Group) => void;
  selectedUserId?: number;
  selectedGroupId?: number;
}

export default function ChatSidebar({ onSelectUser, onSelectGroup, selectedUserId, selectedGroupId }: ChatSidebarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [groups, setGroups] = useState<Group[]>([
    {
      id: 101,
      name: "Project Team",
      // description: "Team collaborationsss",
      lastMessage: "Let's meet tomorrow",
      time: "11:45",
      members: [users[0], users[1]],
      createdAt: new Date(),
    },
  ]);

  // Filter users based on search query (minimum 2 characters)
  const filteredUsers = searchQuery.length >= 2
    ? users.filter((user) => {
        const query = searchQuery.toLowerCase();
        const nameMatch = user.name.toLowerCase().includes(query);
        const messageMatch = user.lastMessage.toLowerCase().includes(query);
        return nameMatch || messageMatch;
      })
    : users;

  // Filter groups based on search query
  const filteredGroups = searchQuery.length >= 2
    ? groups.filter((group) => {
        const query = searchQuery.toLowerCase();
        const nameMatch = group.name.toLowerCase().includes(query);
        const messageMatch = group.lastMessage.toLowerCase().includes(query);
        const descMatch = group.description?.toLowerCase().includes(query);
        return nameMatch || messageMatch || descMatch;
      })
    : groups;

  const handleCreateGroup = (groupData: { name: string; description?: string; members: User[] }) => {
    const newGroup: Group = {
      ...groupData,
      id: Date.now(),
      lastMessage: "Group created",
      time: "Now",
      createdAt: new Date(),
    };
    setGroups(prev => [newGroup, ...prev]);
    setActiveTab("groups");
  };

  // Get logged-in user info from localStorage
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="chat-sidebar">

      {/* Header */}
      <div className="sidebar-header">
        Messages
      </div>

      <div className="sidebar-search">
        <Input 
          placeholder={activeTab === 'chats' ? "Search chats..." : "Search groups..."} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
      </div>

      {/* Tabs for Chats and Groups */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="sidebar-tabs"
        items={[
          {
            key: 'chats',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageOutlined />
                Chats
                <Badge count={users.length} showZero style={{ backgroundColor: 'var(--color-primary)' }} />
              </span>
            ),
            children: (
              <List
                className="chat-list"
                dataSource={filteredUsers}
                locale={{ emptyText: searchQuery.length >= 2 ? "No chats found" : "No chats" }}
                renderItem={(user) => (
                  <List.Item
                    className={`chat-list-item ${selectedUserId === user.id ? 'active' : ''}`}
                    style={{ padding: 0 }}
                    onClick={() => onSelectUser(user)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '8px 12px', gap: '12px' }}>
                      <Avatar style={{ backgroundColor: '#1890ff' }}>{user.name[0]}</Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="list-item-title">{user.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span className="list-item-description" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.lastMessage}
                          </span>
                          <span className="list-item-time">{user.time}</span>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ),
          },
          {
            key: 'groups',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UsergroupAddOutlined />
                Groups
                <Badge count={groups.length} showZero style={{ backgroundColor: 'var(--color-secondary)' }} />
              </span>
            ),
            children: (
              <div>
                <div style={{ padding: '12px' }}>
                  <GroupManagement 
                    availableUsers={users} 
                    onCreateGroup={handleCreateGroup}
                  />
                </div>
                <List
                  className="chat-list"
                  dataSource={filteredGroups}
                  locale={{ emptyText: searchQuery.length >= 2 ? "No groups found" : "No groups yet. Create one!" }}
                  renderItem={(group) => (
                    <List.Item
                      className={`chat-list-item ${selectedGroupId === group.id ? 'active' : ''}`}
                      style={{ padding: 0 }}
                      onClick={() => onSelectGroup && onSelectGroup(group)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '8px 12px', gap: '12px' }}>
                        <Avatar 
                          style={{ backgroundColor: '#52c41a' }}
                          icon={<UsergroupAddOutlined />}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="list-item-title">
                            {group.name}
                            <Badge 
                              count={group.members.length} 
                              style={{ 
                                backgroundColor: 'var(--color-gray-text)', 
                                marginLeft: '8px',
                                fontSize: '10px'
                              }} 
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span className="list-item-description" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {group.lastMessage}
                            </span>
                            <span className="list-item-time">{group.time}</span>
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            ),
          },
        ]}
      />

      {/* User Info Panel at Bottom */}
      <div className="sidebar-user-panel">
        {showUserMenu && (
          <div className="user-menu-dropdown">
            <button className="logout-btn" onClick={handleLogout}>
              <LogoutOutlined />
              <span>Logout</span>
            </button>
          </div>
        )}
        <div
          className="user-info"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <Avatar
            style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
            icon={<UserOutlined />}
          >
            {currentUser?.fullName?.[0]?.toUpperCase()}
          </Avatar>
          <div className="user-info-text">
            <span className="user-name">{currentUser?.fullName || "User"}</span>
            <span className="user-email">{currentUser?.email || ""}</span>
          </div>
          <UpOutlined className={`user-menu-arrow ${showUserMenu ? "open" : ""}`} />
        </div>
      </div>
    </div>
  );
}