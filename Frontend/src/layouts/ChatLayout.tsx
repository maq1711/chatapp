import { useState, useEffect, useRef } from "react";
import { Layout, Button } from "antd";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import ChatSidebar from "../components/ChatSidebar";
import GroupInfoModal from "../components/GroupInfoModal";
import Chat from "../pages/private/Chat/Chat";
import {
  startConnection,
  stopConnection,
  onUserList,
  onGroupCreated,
  createGroupChat,
  leaveGroupChat,
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
  isAdmin?: boolean;
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
  adminId?: number;
  createdAt: Date;
}

export default function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupInfoTarget, setGroupInfoTarget] = useState<Group | null>(null);
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
        const exists = prev.some((group) => String(group.id) === String(incomingGroup.id));
        if (exists) {
          return prev.map((group) =>
            String(group.id) === String(incomingGroup.id)
              ? { ...group, ...incomingGroup }
              : group
          );
        }

        return [incomingGroup, ...prev];
      });
    });

    return () => {
      unsubGroupCreated();
    };
  }, []);

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

  const handleCreateGroup = (groupData: { name: string; description?: string; members: User[] }) => {
    const storedUser = localStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
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

    setGroups((prev) => [newGroup, ...prev]);
    setSelectedGroup(newGroup);
    setSelectedUser(null);
  };

  const handleOpenGroupInfo = (group: Group) => {
    setGroupInfoTarget(group);
  };

  const handleCloseGroupInfo = () => {
    setGroupInfoTarget(null);
  };

  const handleLeaveGroup = (groupId: number) => {
    void leaveGroupChat(String(groupId));
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
    setGroupInfoTarget((prev) => (prev?.id === groupId ? null : prev));
    setSelectedGroup((prev) => (prev?.id === groupId ? null : prev));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const user = JSON.parse(storedUser);
    const currentUserId = Number(user.id);
    if (!Number.isFinite(currentUserId) || currentUserId <= 0) {
      return;
    }

    const unsubUserList = onUserList((users: ConnectedUser[]) => {
      const others: User[] = users
        .filter((u) => u.id !== currentUserId)
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

    startConnection(String(currentUserId), user.fullName);

    return () => {
      unsubUserList();
      stopConnection();
    };
  }, []);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedGroup(null); // Clear group selection
    if (window.innerWidth <= 768) {
      setSidebarVisible(false);
    }
  };

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setSelectedUser(null); // Clear user selection
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
          groups={groups}
          onCreateGroup={handleCreateGroup}
          onOpenGroupInfo={handleOpenGroupInfo}
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
          onOpenGroupInfo={handleOpenGroupInfo}
        />
      </Content>

      <GroupInfoModal
        group={groupInfoTarget}
        open={Boolean(groupInfoTarget)}
        currentUserId={JSON.parse(localStorage.getItem("user") || "null")?.id}
        onClose={handleCloseGroupInfo}
        onLeaveGroup={handleLeaveGroup}
      />
    </Layout>
  );
}
