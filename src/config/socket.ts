import { Server } from "socket.io";
class ChatSocket {
    private io: Server;
    private users:Record<string,string>;
    private chatHistory:any;
    private socketToRoom: { [socketId: string]: string }; // Track rooms per socket
    constructor(io:any) {
        console.log("ChatSocket initialized");
        this.io = io;
        this.users = {}; 
        this.chatHistory = {}; 
        this.socketToRoom = {};
        this.initializeSocket();
    }

    initializeSocket() {
        console.log("Socket.IO initialized and listening for connections...");
        this.io.on("connection", (socket) => {
            console.log("A user connected:", socket.id);
            socket.on("register", (username) => this.handleRegister(socket, username));
            socket.on("startChat", (targetUsername) => this.handleStartChat(socket, targetUsername));
            socket.on("sendMessage", (_targetUsername, message) => this.handleSendMessage(socket, message));
            socket.on("getChatHistory", () => this.handleGetChatHistory(socket));
            socket.on("disconnect", () => this.handleDisconnect(socket));
            socket.on("typing", () => this.handleTyping(socket));
            socket.on("stopTyping", () => this.handleStopTyping(socket));
        });
    } 
  
    handleRegister(socket: any, username: string) {
        this.users[socket.id] = username;
        console.log("Users:", this.users);
        this.io.emit("userList", Object.values(this.users));
        socket.broadcast.emit("userJoined", `${username} has joined the chat!`);
    }
    handleStartChat(socket: any, targetUsername: string) {
        const sender = this.users[socket.id];
        const roomId = [sender, targetUsername].sort().join('-');
        console.log("Room ID in start chat:", roomId);  // Debugging
          // Check if the user is already in the room
          console.log("Sender",sender,"Room id :",roomId);
        if (this.socketToRoom[socket.id] === roomId) {
            console.log("Already in room:", roomId);
            socket.emit('roomJoined', roomId); // Emit the roomId to the client
            return;
        }

 
        // Join the room
        socket.join(roomId);
        this.socketToRoom[socket.id] = roomId;
    
        // Find and join the target user’s room too
        const targetSocketId = Object.keys(this.users).find(id => this.users[id] === targetUsername);
        if (targetSocketId) {
            const targetSocket = this.io.sockets.sockets.get(targetSocketId);
            if (targetSocket) {
                targetSocket.join(roomId);
                this.socketToRoom[targetSocketId] = roomId;
            }
        }
    
        socket.emit('roomJoined', roomId); // Emit the roomId to the client
    }


    handleSendMessage(socket: any, message: string) {
        const sender = this.users[socket.id]; // Get the sender's username
        const roomId = this.socketToRoom[socket.id]; // Get the current room the sender is in
        const receiver = roomId.split('-').find(user => user !== sender); // Extract the receiver's username from the room ID
    
        if (!this.chatHistory[roomId]) {
            this.chatHistory[roomId] = [];
        }
        // console.log("Chat History Before  Push  At sendMessage : ", this.chatHistory);
        // console.log(message)
        this.chatHistory[roomId].push({ from: sender, message });
        // console.log("Chat History After Push  At sendMessage : ", this.chatHistory);
        // Send the message to the recipient
        const targetSocketId = Object.keys(this.users).find(socketId => this.users[socketId] === receiver);
        if (targetSocketId) {
            this.io.to(targetSocketId).emit('receive-message', { from: sender, message });
        }
    
        // Send the message to the sender (to update the sender's view)
        socket.emit('receive-message', { from: 'You', message });
    }
    handleGetChatHistory(socket: any) {
        const roomId = this.socketToRoom[socket.id];
        // console.log("Socket To Room Called : ",this.socketToRoom);
        // console.log("/*/*/*/*/*/",this.socketToRoom[socket.id])
        const history = this.chatHistory[roomId] || [];
        // console.log("Chat History : ",this.chatHistory)
        // console.log(history)
        socket.emit('chatHistory', history); // Send chat history to the client
    }

    handleDisconnect(socket: any) {
        delete this.users[socket.id];
        delete this.socketToRoom[socket.id];
        console.log("User disconnected:", socket.id);
        this.io.emit("userList", Object.values(this.users));
    }
    handleTyping(socket: any) {
        const sender = this.users[socket.id];
        const roomId = this.socketToRoom[socket.id];
        console.log("From TYping : ",this.socketToRoom,sender,roomId);
        if (!roomId) return;

      
        
        socket.to(roomId).emit("typing", sender);
    }

    handleStopTyping(socket: any) {
        const sender = this.users[socket.id];
        const roomId = this.socketToRoom[socket.id];
        if (!roomId) return;

        socket.to(roomId).emit("stopTyping", sender);
    }
}
export default  (io: any) => new ChatSocket(io);



