import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messsageRouter from "./routes/messageRoutes.js";
import {Server} from "socket.io";

// Create Express app and HTTP Server
const app=express();
// we are using HTTP server because socket.io support HTTP server
const server=http.createServer(app);

// Intializing socket.io server
export const io=new Server(server,{
    cors: {origin: "*"}
})

// storing online users
export const userSocketMap={}; // {userId: socketId}

// Socket.io connection handler
io.on("connection",(socket)=>{
    const userId=socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId){
        userSocketMap[userId]=socket.id;
    }

    // Emit online users to all connected clients
    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("disconnect",()=>{
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap));
    })

})

// middleware
app.use(express.json({limit:"4mb"}));
app.use(cors());  // it will allow all URL to connect with our backened

// Setup of Routes
app.use("/api/status",(req,res)=>{
    res.send("server has started");
});
app.use("/api/auth",userRouter);
app.use("/api/messages",messsageRouter);

// connection to MongoDB
await connectDB();

const PORT=process.env.PORT || 5000;
server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})