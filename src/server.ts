import 'module-alias/register';
import dotenv from "dotenv";
import express, { Application } from 'express';
import {router} from '@router/router';
import { initRedisClient } from "@redis";
import {Server} from 'socket.io';
import  http  from 'http';
import initializeChatSocket from '@config/socket';
dotenv.config();
const app:Application  = express();
const server : any  = http.createServer(app);
const io : Server = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
});
initRedisClient();
initializeChatSocket(io);
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(router);


server.listen(Number(process.env.PORT), '0.0.0.0',()=>{
  console.log("Server is Connected :",Number(process.env.PORT));
})

  // "start": "nodemon --require tsconfig-paths/register src/server.ts"
  // "start": "nodemon src/server.ts"
  // "start": "nodemon --require tsconfig-paths/register src/server.ts" 

  // Hello Sir , Redis all the different types of method implements in previous task .

  // any other new task ? 