import { useEffect, useState } from "react";
import { List, Avatar, Input, Tabs, Badge } from "antd";
import { MessageOutlined, UsergroupAddOutlined, LogoutOutlined, UserOutlined, UpOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import GroupManagement from "./GroupManagement";
import { createGroupChat, onGroupCreated, type GroupMember } from "../services/signalRService";
import "./ChatSidebar.css";

interface User {
  id: number;
  name: string;
  connectionId: string;
  lastMessage: string;
  time: string;
  isOnline?: boolean;
  isAdmin?: boolean;
}

interface Group {
  id: number;
  name: string;
  description?: string;
  lastMessage: string;
  time: string;
  members: User[];
  adminId?: number;
  createdAt: Date;
}

interface ChatSidebarProps {
  onSelectUser: (user: User) => void;
  onSelectGroup?: (group: Group) => void;
  selectedUserId?: number;
  selectedGroupId?: number;
  onlineUsers: User[];
  onRequestMobileClose?: () => void;
}

export default function ChatSidebar({ onSelectUser, onSelectGroup, selectedUserId, selectedGroupId, onlineUsers, onRequestMobileClose }: ChatSidebarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [groups, setGroups] = useState<Group[]>([
    // {
    //   id: 101,
    //   name: "Project Team",
    //   lastMessage: "Let's meet tomorrow",
    //   time: "11:45",
    //   members: [],
    //   createdAt: new Date(),
    // },
  ]);

  useEffect(() => {
    const unsubGroupCreated = onGroupCreated((groupId, groupName, description, members, adminId) => {
      const parsedId = Number(groupId);
      const mappedMembers: User[] = members.map((member) => ({
        id: member.id,
        name: member.name,
        connectionId: member.connectionId,
        lastMessage: "",
        time: "",
        isAdmin: member.isAdmin ?? member.id === adminId,
      }));

      const incomingGroup: Group = {
        id: Number.isFinite(parsedId) ? parsedId : Date.now(),
        name: groupName,
        description: description || undefined,
        lastMessage: "Group created",
        time: "Now",
        members: mappedMembers,
        adminId,
        createdAt: new Date(),
      };

      setGroups((prev) => {
        const exists = prev.some((g) => String(g.id) === String(incomingGroup.id));
        if (exists) {
          return prev.map((g) =>
            String(g.id) === String(incomingGroup.id)
              ? { ...g, ...incomingGroup }
              : g
          );
        }
        return [incomingGroup, ...prev];
      });
    });

    return () => {
      unsubGroupCreated();
    };
  }, []);

  const truncatePreview = (text: string, maxWords = 8, maxChars = 60) => {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) return "No messages yet";

    const words = normalized.split(" ");
    let preview = words.slice(0, maxWords).join(" ");
    if (words.length > maxWords) {
      preview += "...";
    }

    if (preview.length > maxChars) {
      return `${preview.slice(0, maxChars).trim()}...`;
    }

    return preview;
  };

  // Filter users based on search query (minimum 2 characters)
  const filteredUsers = searchQuery.length >= 2
    ? onlineUsers.filter((user) => {
        const query = searchQuery.toLowerCase();
        const nameMatch = user.name.toLowerCase().includes(query);
        const messageMatch = (user.lastMessage || "").toLowerCase().includes(query);
        return nameMatch || messageMatch;
      })
    : onlineUsers;

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
    const creatorId = Number(currentUser?.id);
    const creatorName = currentUser?.fullName || "You";

    const creatorMember: User = {
      id: creatorId,
      name: creatorName,
      connectionId: "self",
      lastMessage: "",
      time: "",
      isAdmin: true,
    };

    const nonCreatorMembers = groupData.members
      .filter((member) => member.id !== creatorId)
      .map((member) => ({ ...member, isAdmin: member.isAdmin ?? false }));

    const newGroup: Group = {
      ...groupData,
      id: Date.now(),
      lastMessage: "Group created",
      time: "Now",
      members: [creatorMember, ...nonCreatorMembers],
      adminId: Number.isFinite(creatorId) ? creatorId : undefined,
      createdAt: new Date(),
    };

    void createGroupChat(
      String(newGroup.id),
      newGroup.name,
      newGroup.description,
      newGroup.members.map((member) => member.id),
      creatorId
    );

    setGroups(prev => [newGroup, ...prev]);
    setActiveTab("groups");
  };

  // Get logged-in user info from localStorage
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    const rememberedEmail = currentUser?.email;
    // if (rememberedEmail) {
    //   localStorage.setItem("rememberedEmail", rememberedEmail);
    // }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleCreateGroupModalOpen = () => {
    if (window.innerWidth <= 768) {
      onRequestMobileClose?.();
    }
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
                <Badge count={onlineUsers.length} showZero style={{ backgroundColor: 'var(--color-primary)' }} />
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
                      <Badge dot={user.isOnline} color="#22c55e" offset={[-2, 30]}>
                        <Avatar style={{ backgroundColor: '#1890ff' }}>{user.name[0]}</Avatar>
                      </Badge>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="list-item-title">{user.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span className="list-item-description" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {truncatePreview(user.lastMessage || "")}
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
                    availableUsers={onlineUsers} 
                    onCreateGroup={handleCreateGroup}
                    onModalOpen={handleCreateGroupModalOpen}
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
                              {truncatePreview(group.lastMessage || "")}
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