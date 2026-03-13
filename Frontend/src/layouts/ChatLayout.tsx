import { useState } from "react";
import { Layout, Button } from "antd";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import ChatSidebar from "../components/ChatSidebar";
import Chat from "../pages/private/Chat/Chat";
import "./chat.css";
const { Sider, Content } = Layout;

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

export default function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedGroup(null); // Clear group selection
    // Close sidebar on mobile after selecting a user
    if (window.innerWidth <= 768) {
      setSidebarVisible(false);
    }
  };

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setSelectedUser(null); // Clear user selection
    // Close sidebar on mobile after selecting a group
    if (window.innerWidth <= 768) {
      setSidebarVisible(false);
    }
  };

  return (
    <Layout style={{ height: "100vh" }} className="chat-layout">
      {/* Hamburger Menu Button */}
      <Button
        className="hamburger-menu"
        icon={sidebarVisible ? <CloseOutlined /> : <MenuOutlined />}
        onClick={() => setSidebarVisible(!sidebarVisible)}
        type="text"
        size="large"
      />

      {/* Overlay for mobile */}
      {sidebarVisible && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarVisible(false)}
        />
      )}

      <Sider
        width={320}
        style={{
          background: "var(--color-bacground-secondary)",
          borderRight: `1px solid var(--color-primary)`,
          overflow: "auto",
        }}
        className={`chat-sider ${sidebarVisible ? 'mobile-visible' : ''}`}
        breakpoint="md"
        collapsedWidth="0"
      >
        <ChatSidebar 
          onSelectUser={handleSelectUser} 
          onSelectGroup={handleSelectGroup}
          selectedUserId={selectedUser?.id} 
          selectedGroupId={selectedGroup?.id}
        />
      </Sider>

      <Content
        style={{
          background: "var(--color-bacground-primary)",
          overflow: "auto",
        }}
        className="chat-content"
      >
        <Chat 
          selectedUser={selectedUser} 
          selectedGroup={selectedGroup}
          chatType={selectedGroup ? 'group' : selectedUser ? 'user' : 'user'}
        />
      </Content>
    </Layout>
  );
}
