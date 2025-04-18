import { Server } from "socket.io";

class ChatSocket {
    private io: Server;
    private users: Record<string, string> = {};
    private groups: Record<string, Set<string>> = {}; 
    private userGroups: Record<string, Set<string>> = {}; 
    private chatHistory: Record<string, Array<{ sender: string, message: string }>> = {}; 

    constructor(io: any) {
        console.log("Group Chat Socket initialized");
        this.io = io;
        this.initializeSocket();
    }

    initializeSocket() {
        this.io.on("connection", (socket) => {
            console.log("A user connected:", socket.id);

            socket.on("register", (username: string) => this.handleRegister(socket, username));
            socket.on("createGroup", (groupName: string) => this.handleCreateGroup(socket, groupName));
            socket.on("joinGroup", (groupName: string) => this.handleJoinGroup(socket, groupName));
            socket.on("leaveGroup", (groupName: string) => this.handleLeaveGroup(socket, groupName));
            socket.on("groupMessage", (groupName: string, message: string) => this.handleGroupMessage(socket, groupName, message));
            socket.on("getGroupHistory", (groupName: string) => this.handleGetGroupHistory(socket, groupName));
            socket.on("disconnect", () => this.handleDisconnect(socket));
            socket.on('getGroupUsers',(groupName: string) => this.handleGroupUsers(socket,groupName));
        });
    }

    handleRegister(socket: any, username: string) {
        this.users[socket.id] = username;
        socket.emit("registered", username);
        this.emitGroupListsForUser(socket);
    }

    handleCreateGroup(socket: any, groupName: string) {
        const groupId = `group-${groupName}`;
    
        if (!this.groups[groupId]) {
            this.groups[groupId] = new Set();
            this.chatHistory[groupId] = [];
        }
    
        // Add the user who created the group to the group
        this.groups[groupId].add(socket.id);
    
        if (!this.userGroups[socket.id]) {
            this.userGroups[socket.id] = new Set();
        }
        this.userGroups[socket.id].add(groupId);
    
        // Join the group
        socket.join(groupId);
        // this.emitGroupListsForUser(socket);
        // Notify the user that the group was created and they joined it
        socket.emit("joinedGroup", groupName);
        this.updateGroupList();
    

    }
    
    updateGroupList() {
        const allSockets = this.io.sockets.sockets;
    
        for (const [socketId, socket] of allSockets) {
            this.emitGroupListsForUser(socket);
        }
    }

    handleJoinGroup(socket: any, groupName: string) {
        if (!this.groups[groupName]) {
            this.groups[groupName] = new Set();
            this.chatHistory[groupName] = []; 
        }
        this.groups[groupName].add(socket.id);
  
        if (!this.userGroups[socket.id]) {
            this.userGroups[socket.id] = new Set();
        }
        this.userGroups[socket.id].add(groupName);

        socket.join(groupName);
        socket.emit("joinedGroup", groupName);
        this.io.to(groupName).emit("groupMessage", {
            message: `${this.users[socket.id]} joined the group.`,
            from: 'System',
        });
        this.handleGetGroupHistory(socket, groupName);
        this.emitGroupListsForUser(socket);
    }

    handleLeaveGroup(socket: any, groupName: string) {
        this.groups[groupName]?.delete(socket.id);
        this.userGroups[socket.id]?.delete(groupName);
        socket.leave(groupName);
        socket.emit("leftGroup", groupName);
        // this.io.to(groupName).emit("userLeftGroup", `${this.users[socket.id]} left ${groupName}`);
        this.io.to(groupName).emit("groupMessage", {
            message: `${this.users[socket.id]} left the group.`,
            from: 'System',
        });
        this.emitGroupListsForUser(socket);

    }
    handleGetGroupHistory(socket: any, groupName: string) {
        const history = this.chatHistory[groupName] || [];
        socket.emit("groupHistory", { group: groupName, history });
    }

    handleGroupMessage(socket: any, groupName: string, message: string) {
        const sender = this.users[socket.id];
        this.chatHistory['group-'+groupName] = this.chatHistory['group-'+groupName] || [];
        this.chatHistory['group-'+groupName].push({ sender, message });
       
        this.io.to('group-'+groupName).emit("groupMessage", { from: sender, message });
    }

    handleDisconnect(socket: any) {
        const username = this.users[socket.id];
        delete this.users[socket.id];

        // Remove user from all groups they joined
        const groups = this.userGroups[socket.id] || new Set();
        groups.forEach(group => {
            this.groups[group]?.delete(socket.id);
            this.io.to(group).emit("userLeftGroup", `${username} disconnected`);
        });

        delete this.userGroups[socket.id];
    }

    // Emit group lists specific to the user
    emitGroupListsForUser(socket: any) {
        const allGroups = Object.keys(this.groups); // ['group-friends', 'group-music', etc.]
        const joinedGroups = Array.from(this.userGroups[socket.id] || []);
        // Filter out joined from all to get non-joined
        const notJoinedGroups = allGroups.filter(group => !joinedGroups.includes(group));
        socket.emit('groupLists', {
            joinedGroups: joinedGroups.map(g => g.replace('group-', '')),
            otherGroups: notJoinedGroups.map(g => g.replace('group-', ''))
        });
    }

    handleGroupUsers(socket:any,groupName:string){
        const groupId = `group-${groupName}`;
        const socketIdsInGroup = this.groups[groupId] || new Set();
        const users = Array.from(socketIdsInGroup)
        .map(sid => this.users[sid])
        .filter(Boolean);

        socket.emit("groupUsers", { group: groupName, users });
    }

}

export default (io: any) => new ChatSocket(io);
