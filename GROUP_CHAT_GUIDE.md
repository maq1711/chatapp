# Group Chat Feature Guide

## Overview
The Chat Application now supports **real-time group messaging** alongside traditional one-to-one conversations. Users can create groups with multiple members and communicate collaboratively.

## Features

### 1. Group Creation
- **Create Groups**: Click the "Create Group" button in the Groups tab
- **Fill in Details**:
  - **Group Name** (required): Up to 50 characters
  - **Description** (optional): Up to 200 characters
  - **Members** (required): Minimum 3 members to form a group
- **Validation**: Groups cannot be created with fewer than 3 members
- **Success Confirmation**: Message displays after successful creation

### 2. Group Management
- **Switch Tabs**: Use "Chats" tab for one-to-one messages and "Groups" tab for group conversations
- **Group Badges**: Shows member count next to each group name
- **Search Groups**: Use search bar to find groups by name, description, or last message
- **Select Groups**: Click any group to view conversation and send messages

### 3. Group Messaging
- **Send Messages**: Type and send messages to all group members
- **Group Header**: Displays:
  - Group name with member count badge
  - Group description (if provided)
  - Member list with count
- **Sender Identification**: In group chats, sender names appear above messages from other members
- **Message History**: Each group maintains separate message history

### 4. Message Operations
- **Edit Messages**: Click the "..." menu on your own messages and select "Edit"
- **Delete Messages**: Click the "..." menu and select "Delete"
- **Real-time Display**: Messages show timestamps and update immediately

## User Interface

### Sidebar
```
┌─────────────────────┐
│  Messages           │
├─────────────────────┤
│  🔍 Search...       │
├─────────────────────┤
│  💬 Chats (3)       │  ← Badge shows count
│  👥 Groups (1)      │  
├─────────────────────┤
│ Chats Tab:          │
│  - Ali              │
│  - Ahmed            │
│  - Sara             │
│                     │
│ Groups Tab:         │
│  [+] Create Group   │
│  - Project Team (2) │
└─────────────────────┘
```

### Chat Area
```
┌─────────────────────────┐
│ 👥 Project Team (2 mbr) │  ← Group header
│ Team collaboration      │
├─────────────────────────┤
│                         │
│ Ali:                    │
│ Hello team!             │
│                         │
│             My message  │ (no sender name - it's you)
│                         │
│ Ahmed:                  │
│ Let's meet tomorrow     │ (sender name shown)
│                         │
├─────────────────────────┤
│ [Message input box]  [Send] │
└─────────────────────────┘
```

## Implementation Details

### File Structure
```
src/
├── components/
│   ├── ChatSidebar.tsx      (Tabs UI, search, group list)
│   └── GroupManagement.tsx  (Modal for creating groups)
├── layouts/
│   └── ChatLayout.tsx       (State management for users/groups)
├── pages/
│   └── private/
│       └── Chat/
│           └── Chat.tsx     (Dual user/group chat support)
└── types/
    ├── components.ts
    └── pages.ts
```

### Key Components

#### ChatLayout
Manages overall chat state:
- `selectedUser`: Currently selected user
- `selectedGroup`: Currently selected group
- Handles mutual exclusivity (can't select both simultaneously)
- Passes appropriate props to Chat component

#### ChatSidebar
Displays tabs and manages group/user selection:
- **Chats Tab**: Lists all users with search functionality
- **Groups Tab**: Shows create button and list of groups
- **GroupManagement**: Modal for group creation
- **Search**: Works on both users and groups (minimum 2 characters)

#### GroupManagement
Modal dialog for creating groups:
- Group name and description inputs
- Member selection list (checkboxes)
- Minimum 3 members validation
- Shows selected members as removable tags

#### Chat
Unified chat component supporting both:
- **User Chat**: Shows messages with one user
- **Group Chat**: Shows messages with sender names for identification

### Data Models

```typescript
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

interface Message {
  id: number;
  text: string;
  sender: "me" | "other";
  time: string;
  senderName?: string;  // Used for group messages
}
```

## Usage Examples

### Creating a Group
1. Navigate to the "Groups" tab in the sidebar
2. Click "Create Group" button
3. Enter group name (e.g., "Project Team")
4. Add description (optional, e.g., "Team collaboration")
5. Select at least 3 members by clicking on users in the list
6. Click "Create Group" button
7. Group appears in the Groups list

### Messaging in a Group
1. Click on the group name in the Groups tab
2. Group header shows name and member count
3. Type message in the input field
4. Press Enter or click Send
5. Messages show sender names (except your own)
6. Reply to specific messages or start new conversations

### Searching
- **For Users**: Type 2+ characters in search (e.g., "Ali" searches in name and last message)
- **For Groups**: Type 2+ characters to filter by group name, description, or messages

## Constraints and Limitations

- **Minimum Members**: Groups must have at least 3 members
- **Group Name**: Maximum 50 characters
- **Description**: Maximum 200 characters
- **Search**: Requires minimum 2 characters
- **Mutual Selection**: Can only be in one user or group chat at a time

## Threading and Context

Messages in groups are organized chronologically and include:
- Sender identification for clarity
- Timestamps for ordering
- Full conversation history per group
- Edit/delete capabilities for own messages

## Future Enhancements

Potential features for future versions:
- Real-time messaging via WebSocket (Socket.IO or SignalR)
- Group member management (add/remove members)
- Group role management (admin, moderator, member)
- Pinned messages in groups
- Typing indicators
- Group information editing
- Leave group functionality
- Group notifications and mentions (@username)
- Message reactions and emojis
- File sharing in groups
- Voice/video group calls

## Styling

The group chat UI inherits styles from:
- `src/components/ChatSidebar.css`: Sidebar and list item styles
- `src/pages/private/Chat/Chat.css`: Chat message and input styles
- Theme variables from CSS custom properties (--color-primary, etc.)

## Troubleshooting

### Group creation fails with "Please add at least 3 members"
- Ensure you've selected exactly 3 or more members
- Click on user names in the list to toggle selection
- Check the "Selected Members" section shows your choices

### Can't find a group after creating it
- Check that you're in the "Groups" tab
- Use search if it's not visible in the main list
- Clear search filter to see all groups

### Messages not showing sender names in groups
- Ensure you're viewing a group chat (not a personal chat)
- Sender names only appear for messages from other members
- Your own messages don't show a sender name

## Support

For issues or feature requests, update the GROUP_CHAT_GUIDE.md or the main README.md with your findings.
