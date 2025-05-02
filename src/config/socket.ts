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
            socket.on('customEvent',(message:string) => this.handleCustomEvent(socket,message));
            socket.on('sendBroadcastMessage',() => this.sendBroadcastMessage(socket));
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
        console.log("Rooms Was Creatde : ",socket.rooms);
        // this.emitGroupListsForUser(socket);
   
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

        // It gives All the inforamtion of no of rooms and each rooms  has no. of Members .
        console.log(this.io.sockets.adapter);
        const rooms = this.io.sockets.adapter.rooms;
        for (const [roomName, socketsSet] of rooms) {
            console.log(`Room: ${roomName}, Members: ${[...socketsSet].join(', ')}`);
        }
    }

    handleLeaveGroup(socket: any, groupName: string) {
        console.log("THis Group : ",this.groups)
        this.groups[groupName]?.delete(socket.id);
        this.userGroups[socket.id]?.delete(groupName);
        socket.leave(groupName);
        socket.emit("leftGroup", groupName);
     
        this.io.to(groupName).emit("groupMessage", {
            message: `${this.users[socket.id]} left the group.`,
            from: 'System',
        });

        if (this.groups[groupName] && this.groups[groupName].size === 0) {
            delete this.groups[groupName]; // delete the group
        }
    
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
       
        // this.io.to('group-'+groupName).emit("groupMessage", { from: sender, message });  // this line send Message to all users  including send users also 
        socket.to('group-'+groupName).emit("groupMessage", { from: sender, message });
        // This line Send message in given group name excluding sender.

    }

    handleDisconnect(socket: any) {
        const username = this.users[socket.id];
        delete this.users[socket.id];
        const groups = this.userGroups[socket.id] || new Set();
        groups.forEach(group => {
            this.groups[group]?.delete(socket.id);
            this.io.to(group).emit("userLeftGroup", `${username} disconnected`);
        });
       
        delete this.userGroups[socket.id];
        console.log(socket.rooms)
    }

    
    emitGroupListsForUser(socket: any) {
        const allGroups = Object.keys(this.groups); 
        const joinedGroups = Array.from(this.userGroups[socket.id] || []);
      
        const notJoinedGroups = allGroups.filter(group => !joinedGroups.includes(group));
        socket.emit('groupLists', {
            joinedGroups: joinedGroups.map(g => g.replace('group-', '')),
            otherGroups: notJoinedGroups.map(g => g.replace('group-', ''))
        });
    }

    async handleGroupUsers(socket:any,groupName:string){
        const groupId = `group-${groupName}`;
        const socketIdsInGroup = this.groups[groupId] || new Set();
        // const socketIdsInGroup = await this.io.in(groupId).allSockets(); // its give  list of all socket which are present in that group . 
        // now its depricated  
        const users = Array.from(socketIdsInGroup)
        .map(sid => this.users[sid])
        .filter(Boolean);

        socket.emit("groupUsers", { group: groupName, users });   
    }

    handleCustomEvent(socket:any,message:string){
        console.log("custom event ma avyu ....",message);
        socket.emit('customEvent',{messgae:'Custom Event Mathi Call RTHayo aa message ....'});
    }
    sendBroadcastMessage(socket:any){
        const groupNames = Object.keys(this.groups); 

        let emitChain:any = this.io;
        // Chain `.to()` for each group name
        groupNames.forEach(groupName => {
            emitChain =emitChain.to(groupName);
        });
        
        // Now emit the event to all groups at once . it found the all the group memeber of union and send broadcast Messages 
        emitChain.emit("announcement", {
          text: 'We have Meeting at 3 AM ',
          type: "info",
        });
        console.log("EMititng the messages")
    }
}

export default (io: any) => new ChatSocket(io);
