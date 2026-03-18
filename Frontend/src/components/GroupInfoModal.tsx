import { Avatar, Button, List, Modal, Tag } from "antd";
import { UserOutlined, UsergroupAddOutlined } from "@ant-design/icons";

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

interface GroupInfoModalProps {
  group: Group | null;
  open: boolean;
  currentUserId?: number;
  onClose: () => void;
  onLeaveGroup: (groupId: number) => void;
}

export default function GroupInfoModal({ group, open, currentUserId, onClose, onLeaveGroup }: GroupInfoModalProps) {
  if (!group) {
    return null;
  }

  const createdAt = new Date(group.createdAt);
  const isMember = typeof currentUserId === "number" && group.members.some((member) => member.id === currentUserId);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Avatar style={{ backgroundColor: "#52c41a" }} icon={<UsergroupAddOutlined />} />
          <div>
            <div style={{ fontWeight: 600 }}>{group.name}</div>
            <div style={{ fontSize: "12px", color: "var(--color-gray-text)" }}>{group.members.length} members</div>
          </div>
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="leave"
          danger
          onClick={() => onLeaveGroup(group.id)}
          disabled={!isMember}
        >
          Leave Group
        </Button>,
      ]}
    >
      <div style={{ display: "grid", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--color-gray-text)", marginBottom: "6px" }}>Description</div>
          <div>{group.description || "No description added"}</div>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Tag color="green">{group.members.length} members</Tag>
          <Tag color="blue">Created {Number.isNaN(createdAt.getTime()) ? "recently" : createdAt.toLocaleString()}</Tag>
        </div>

        <div>
          <div style={{ fontSize: "12px", color: "var(--color-gray-text)", marginBottom: "8px" }}>Members</div>
          <List
            bordered
            dataSource={group.members}
            locale={{ emptyText: "No members" }}
            renderItem={(member) => (
              <List.Item>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
                  <Avatar style={{ backgroundColor: "#1890ff", flexShrink: 0 }} icon={<UserOutlined />}>
                    {member.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{member.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-gray-text)" }}>
                      {member.id === currentUserId ? "You" : member.isOnline ? "Online" : "Member"}
                    </div>
                  </div>
                  {member.isAdmin && <Tag color="gold">Admin</Tag>}
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>
    </Modal>
  );
}