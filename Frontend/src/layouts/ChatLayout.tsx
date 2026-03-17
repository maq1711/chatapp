import { useState, useEffect, useRef } from "react";
import { Layout, Button } from "antd";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import ChatSidebar from "../components/ChatSidebar";
import Chat from "../pages/private/Chat/Chat";
import {
  startConnection,
  stopConnection,
  onUserList,
  type ConnectedUser,
} from "../services/signalRService";
import "./chat.css";
const { Sider, Content } = Layout;

interface User {
  id: number;
  name: string;
  connectionId: string;
  lastMessage: string;
  time: string;
  isOnline?: boolean;
}

interface ChatPreview {
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
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const hasAutoSelectedInitialChat = useRef(false);
  const [chatPreviews, setChatPreviews] = useState<Record<number, ChatPreview>>(() => {
    try {
      const raw = localStorage.getItem("chat-user-previews");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const chatPreviewsRef = useRef(chatPreviews);

  useEffect(() => {
    chatPreviewsRef.current = chatPreviews;
  }, [chatPreviews]);

  useEffect(() => {
    if (hasAutoSelectedInitialChat.current) return;
    if (selectedUser || selectedGroup) return;
    if (onlineUsers.length === 0) return;

    setSelectedUser(onlineUsers[0]);
    hasAutoSelectedInitialChat.current = true;
  }, [onlineUsers, selectedUser, selectedGroup]);

  const handleUserPreviewUpdate = (userId: number, lastMessage: string, time: string) => {
    setChatPreviews((prev) => {
      const next = {
        ...prev,
        [userId]: { lastMessage, time },
      };
      localStorage.setItem("chat-user-previews", JSON.stringify(next));
      return next;
    });

    setOnlineUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, lastMessage, time } : user
      )
    );
  };

  // Connect to SignalR when chat page loads
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const user = JSON.parse(storedUser);

    // Register UserList callback BEFORE starting connection
    // so we catch the initial broadcast from OnConnectedAsync
    const unsubUserList = onUserList((users: ConnectedUser[]) => {
      const me = user.id;
      const others: User[] = users
        .filter((u) => u.id !== me)
        .map((u) => ({
          ...u,
          isOnline: true,
          id: u.id,
          name: u.name,
          connectionId: u.connectionId,
          lastMessage: chatPreviewsRef.current[u.id]?.lastMessage || "Start chatting...",
          time: chatPreviewsRef.current[u.id]?.time || "",
        }));
      setOnlineUsers(others);

      // Keep selectedUser's connectionId in sync with latest UserList
      setSelectedUser(prev => {
        if (!prev) return prev;
        const updated = others.find(u => u.id === prev.id);
        if (updated && updated.connectionId !== prev.connectionId) {
          return {
            ...prev,
            connectionId: updated.connectionId,
            isOnline: true,
            lastMessage: updated.lastMessage,
            time: updated.time,
          };
        }
        return prev;
      });
    });

    // Now start the connection — listeners are already in place
    startConnection(String(user.id), user.fullName);

    return () => {
      unsubUserList();
      stopConnection();
    };
  }, []);

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

  const handleRequestMobileSidebarClose = () => {
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
          onlineUsers={onlineUsers}
          onRequestMobileClose={handleRequestMobileSidebarClose}
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
          onUserPreviewUpdate={handleUserPreviewUpdate}
        />
      </Content>
    </Layout>
  );
}
