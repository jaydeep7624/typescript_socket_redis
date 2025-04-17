import { Server } from "socket.io";
class ChatSocket {
    private io: Server;
    private users:Record<string,string>;
    private chatHistory:any;
    private rooms: Record<string, Set<string>>; 
    constructor(io:any) {
        console.log("ChatSocket initialized");
        this.io = io;
        this.users = {}; 
        this.chatHistory = {}; 
        this.rooms={};
        this.initializeSocket();

    }

    initializeSocket() { 
        console.log("Socket.IO initialized and listening for connections...");
        this.io.on('connection', (socket) => {
            console.log('A user connected:', socket.id);
            socket.on('joinRoom', (roomName) => this.handleJoinRoom(socket, roomName));
            socket.on('leaveRoom', (roomName) => this.handleLeaveRoom(socket, roomName));
            socket.on('roomMessage', (roomName, message) => this.handleRoomMessage(socket, roomName, message));
            socket.on('register', (username) => this.handleRegister(socket, username));
            socket.on('sendMessage', (targetUsername, message) => this.handleSendMessage(socket, targetUsername, message));
            socket.on('getChatHistory', (targetUsername) => this.handleGetChatHistory(socket, targetUsername));
            socket.on('disconnect', () => this.handleDisconnect(socket));
            socket.on('typing', (targetUser) => this.handleTyping(socket, targetUser));
            socket.on('stopTyping', (targetUser) => this.handleStopTyping(socket, targetUser));
        });
    }    
  
    handleRegister(socket:any, username:string) {
        this.users[socket.id] = username;
        console.log('Users:', this.users);
        this.io.emit('userList', Object.values(this.users));
        socket.broadcast.emit('userJoined', `${username} has joined the chat!`);
    }  

    handleSendMessage(socket:any, targetUsername:string, message:string) {
        console.log(targetUsername, message);
        const sender = this.users[socket.id];
        const chatKey = [sender, targetUsername].sort().join('-');
       
        if (!this.chatHistory[chatKey]) this.chatHistory[chatKey] = [];
        this.chatHistory[chatKey].push({ from: sender, message });

        const targetSocketId = Object.keys(this.users).find(socketId => this.users[socketId] === targetUsername);
        if (targetSocketId) {
            this.io.to(targetSocketId).emit('receive-message', { from: sender, message, to: targetUsername });
        }
        socket.emit('receive-message', { from: 'You', message });
    }

    handleGetChatHistory(socket:any, targetUsername:string) {
        const sender = this.users[socket.id];
        const chatKey = [sender, targetUsername].sort().join('-');
        const history = this.chatHistory[chatKey] || [];
        socket.emit('chatHistory', history);
    }

    handleDisconnect(socket:any) {
        delete this.users[socket.id];
        console.log('User disconnected:', socket.id);
        this.io.emit('userList', Object.values(this.users));
    }

    handleTyping(socket:any, targetUser:string) {
        const recipientSocketId = Object.keys(this.users).find(key => this.users[key] === targetUser);
        if (recipientSocketId) {
            this.io.to(recipientSocketId).emit('typing', this.users[socket.id]);
        }
    }

    handleStopTyping(socket:any, targetUser:string) {
        const recipientSocketId = Object.keys(this.users).find(key => this.users[key] === targetUser);
        if (recipientSocketId) {
            this.io.to(recipientSocketId).emit('stopTyping', this.users[socket.id]);
        }
    }
    handleRoomMessage(socket: any, roomName: string, message: string) {
        const username = this.users[socket.id];
        if (!username) return;
    
        this.io.to(roomName).emit('roomMessage', `${username}: ${message}`);
    }
    handleLeaveRoom(socket: any, roomName: string) {
        const username = this.users[socket.id];
        if (!username) return;
    
        socket.leave(roomName);
    
        if (this.rooms[roomName]) {
            this.rooms[roomName].delete(username);
            if (this.rooms[roomName].size === 0) {
                delete this.rooms[roomName];
            } else {
                this.io.to(roomName).emit('roomUsers', Array.from(this.rooms[roomName]));
            }
            this.io.to(roomName).emit('roomMessage', `${username} left room ${roomName}`);
        }
    }
    handleJoinRoom(socket: any, roomName: string) {
        const username = this.users[socket.id];
    console.log(`User ${username} is trying to join room ${roomName}`);
    if (!username) return;

    // The user joins the dynamically created room
    socket.join(roomName);

    // Track users in the room
    if (!this.rooms[roomName]) {
        this.rooms[roomName] = new Set();
    }
    this.rooms[roomName].add(username);

    // Notify the room about the new user
    this.io.to(roomName).emit('roomMessage', `${username} joined room ${roomName}`);
    this.io.to(roomName).emit('roomUsers', Array.from(this.rooms[roomName]));
    }
    
}
export default  (io: any) => new ChatSocket(io);



