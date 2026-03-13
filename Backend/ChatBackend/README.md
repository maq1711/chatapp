# ChatBackend - .NET WebAPI with SignalR

This is the backend for the ChatApp real-time messaging application built with .NET 8 and SignalR.

## Prerequisites

- .NET 8 SDK or later
- Visual Studio 2022 or Visual Studio Code with C# extension

## Project Structure

```
Backend/
└── ChatBackend/
    ├── Controllers/
    │   ├── MessageController.cs
    │   └── GroupController.cs
    ├── Hubs/
    │   └── ChatHub.cs
    ├── Program.cs
    ├── ChatBackend.csproj
    └── .gitignore
```

## Setup Instructions

### 1. Navigate to Backend Folder

```bash
cd Backend/ChatBackend
```

### 2. Install NuGet Packages (if not already installed)

```bash
dotnet add package Microsoft.AspNetCore.SignalR
dotnet restore
```

### 3. Build the Project

```bash
dotnet build
```

### 4. Run the Application

```bash
dotnet run
```

The API will be available at `https://localhost:7169` (HTTPS) or `http://localhost:5025` (HTTP)

## Features

### SignalR Hub (ChatHub)
Real-time messaging capabilities:
- **JoinWebsite**: User joins the website lobby
- **JoinGroup**: User joins a specific chat group
- **LeaveGroup**: User leaves a chat group
- **SendPrivateMessage**: Send message to specific user
- **SendGroupMessage**: Send message to a group

### REST API Endpoints

#### Messages
- `GET /api/message/history/{groupId}` - Get message history
- `POST /api/message/send` - Send a message

#### Groups
- `GET /api/group` - Get all groups
- `POST /api/group/create` - Create a new group
- `GET /api/group/{groupId}` - Get group details

## CORS Configuration

Frontend is allowed to connect from:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (Alternative)

To modify allowed origins, edit the CORS policy in `Program.cs`.

## Database Integration (TODO)

Currently using in-memory storage. To integrate a database:
1. Install Entity Framework Core packages
2. Create DbContext models
3. Implement data persistence in controllers

## Troubleshooting

- **Port already in use**: Change the port in `appsettings.json`
- **CORS errors**: Verify frontend origin is in the CORS policy
- **SignalR connection issues**: Check WebSocket support in your environment
