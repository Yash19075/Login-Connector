import connectDB from "./db/database.js"
import dotenv from 'dotenv'
import { app } from "./app.js"
import http from 'http'
import { initializeSocket } from './utils/socket.js'

dotenv.config({
    path: './.env'
})

const server = http.createServer(app)
const io = initializeSocket(server)

connectDB()
.then(() => {   
    server.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err)
})

export { io }