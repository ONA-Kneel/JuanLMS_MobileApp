import dotenv from 'dotenv';
dotenv.config({ path: './config.env' }); // ✅ Load config.env

import mongoose from 'mongoose';
import connect from "./connect.cjs";
import express from "express";
import cors from "cors"
import users from "./routes/userRoutes.js"
import messagesRouter from './routes/messages.js';
// const express = require("express")
// const cors = require("cors")

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())
app.use(users)
app.use('/api/messages', messagesRouter)

mongoose.connect(process.env.ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Mongoose connected to MongoDB!'))
.catch(err => {
  console.error('Mongoose connection error:', err);
  process.exit(1);
});
const startServer = async () => {
    await connect.connectToServer()
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
})
}

startServer()
