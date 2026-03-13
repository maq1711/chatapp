import { useState } from "react";
import { Modal, Input, Button, Avatar, List, Tag, message } from "antd";
import { PlusOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import "./GroupManagement.css";

interface User {
  id: number;
  name: string;
  connectionId: string;
  lastMessage: string;
  time: string;
}

interface GroupManagementProps {
  availableUsers: User[];
  onCreateGroup: (group: { name: string; description?: string; members: User[] }) => void;
}

export default function GroupManagement({ availableUsers, onCreateGroup }: GroupManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      message.error("Group name is required");
      return;
    }

    if (selectedMembers.length < 3) {
      message.error("Please add at least 3 members to create a group");
      return;
    }

    const members = availableUsers.filter(user => selectedMembers.includes(user.id));
    
    onCreateGroup({
      name: groupName,
      description: groupDescription || undefined,
      members,
    });

    message.success(`Group "${groupName}" created successfully!`);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGroupName("");
    setGroupDescription("");
    setSelectedMembers([]);
  };

  const handleMemberToggle = (userId: number) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const removeMember = (userId: number) => {
    setSelectedMembers(prev => prev.filter(id => id !== userId));
  };

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsModalOpen(true)}
        style={{ width: '100%', marginBottom: '12px' }}
      >
        Create Group
      </Button>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UsergroupAddOutlined />
            <span>Create New Group</span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        centered
        wrapperClassName="group-modal-wrapper"
        footer={[
          <Button key="cancel" onClick={handleCloseModal}>
            Cancel
          </Button>,
          <Button 
            key="create" 
            type="primary" 
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedMembers.length < 3}
          >
            Create Group
          </Button>,
        ]}
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
          {/* Group Name */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Group Name <span style={{ color: 'red' }}>*</span>
            </label>
            <Input
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
              showCount
            />
          </div>

          {/* Group Description */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Description (Optional)
            </label>
            <Input.TextArea
              placeholder="Enter group description"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              rows={3}
              maxLength={200}
              showCount
            />
          </div>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Selected Members ({selectedMembers.length}/3 minimum)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedMembers.map(userId => {
                  const user = availableUsers.find(u => u.id === userId);
                  return user ? (
                    <Tag
                      key={userId}
                      closable
                      onClose={() => removeMember(userId)}
                      style={{ padding: '4px 8px', fontSize: '14px' }}
                    >
                      {user.name}
                    </Tag>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Add Members */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Add Members (Minimum 3 required) <span style={{ color: 'red' }}>*</span>
            </label>
            <List
              className="member-selection-list"
              dataSource={availableUsers}
              style={{ 
                maxHeight: '300px', 
                overflow: 'auto',
                border: '1px solid var(--color-primary)',
                borderRadius: '8px'
              }}
              renderItem={(user) => (
                <List.Item
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: selectedMembers.includes(user.id) 
                      ? 'var(--color-primary)' 
                      : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleMemberToggle(user.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <Avatar style={{ backgroundColor: '#1890ff' }}>
                      {user.name[0]}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{user.name}</div>
                    </div>
                    {selectedMembers.includes(user.id) && (
                      <Tag color="success">Selected</Tag>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
