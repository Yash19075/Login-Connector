import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { User } from '../models/user.models.js'
import { Item } from '../models/items.models.js'
import { Chat } from '../models/chat.models.js'
import { asyncHandler } from './asyncHandler.js'
import { ApiError } from './ApiError.js'
import { ApiResponse } from './ApiResponse.js'

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true
    }
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new ApiError(401, 'No token provided'))
      }
      
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      const user = await User.findById(decoded._id).select("-password -refreshToken")
      
      if (!user) {
        return next(new ApiError(404, 'User not found'))
      }
      
      socket.userId = user._id.toString()
      socket.user = user
      next()
    } catch (err) {
      next(new ApiError(401, 'Authentication failed'))
    }
  })

  const handlePublicMessage = asyncHandler(async (socket, data) => {
    const { itemId, message } = data
    
    if (!message || !message.trim()) {
      throw new ApiError(400, "Message cannot be empty")
    }

    const item = await Item.findById(itemId)
    if (!item) {
      throw new ApiError(404, "Item not found")
    }

    const newMessage = {
      message: message.trim(),
      sentBy: socket.userId,
    }
    
    item.chat.push(newMessage)
    await item.save()
    await item.populate("chat.sentBy", "username fullName avatar")
    
    const populatedMessage = item.chat[item.chat.length - 1]
    
    io.to(`item-${itemId}`).emit('new-public-message', 
      new ApiResponse(201, populatedMessage, "Message sent successfully")
    )
  })

  const handlePrivateMessage = asyncHandler(async (socket, data) => {
    const { itemId, otherUserId, message } = data
    
    if (!message || !message.trim()) {
      throw new ApiError(400, "Message cannot be empty")
    }

    if (!otherUserId) {
      throw new ApiError(400, "Recipient user ID is required")
    }

    const item = await Item.findById(itemId).populate("postedBy")
    if (!item) {
      throw new ApiError(404, "Item not found")
    }

    const otherUser = await User.findById(otherUserId)
    if (!otherUser) {
      throw new ApiError(404, "Recipient user not found")
    }

    const sellerId = item.postedBy._id.toString()
    const currentUserId = socket.userId
    
    if (currentUserId === otherUserId) {
      throw new ApiError(400, "You cannot send a message to yourself")
    }

    if (currentUserId !== sellerId && otherUserId !== sellerId) {
      throw new ApiError(400, "Private messages can only be sent between the item seller and potential buyers")
    }

    const newMessage = await Chat.create({
      item: itemId,
      sentBy: socket.userId,
      message: message.trim(),
    })
    
    await newMessage.populate("sentBy", "username fullName avatar")
    await newMessage.populate("item", "name picture price postedBy")
    
    const roomId = [itemId, socket.userId, otherUserId].sort().join('-')
    
    io.to(`private-${roomId}`).emit('new-private-message', 
      new ApiResponse(201, newMessage, "Private message sent successfully")
    )
  })

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected`)
    
    socket.on('join-item-room', (itemId) => {
      socket.join(`item-${itemId}`)
      console.log(`User ${socket.user.username} joined room: item-${itemId}`)
    })
    
    socket.on('join-private-room', (roomData) => {
      const { itemId, otherUserId } = roomData
      const roomId = [itemId, socket.userId, otherUserId].sort().join('-')
      socket.join(`private-${roomId}`)
      console.log(`User ${socket.user.username} joined private room: ${roomId}`)
    })
    
    socket.on('public-message', async (data) => {
      try {
        await handlePublicMessage(socket, data)
      } catch (error) {
        console.error('Public message error:', error)
        socket.emit('error', {
          statusCode: error.statusCode || 500,
          message: error.message || "Failed to send message"
        })
      }
    })
    
    socket.on('private-message', async (data) => {
      try {
        await handlePrivateMessage(socket, data)
      } catch (error) {
        console.error('Private message error:', error)
        socket.emit('error', {
          statusCode: error.statusCode || 500,
          message: error.message || "Failed to send private message"
        })
      }
    })
    
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`)
    })
  })

  return io
}