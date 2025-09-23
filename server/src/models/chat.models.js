import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    item: {
      type: mongoose.Schema.ObjectId,
      ref: "Item",
      required: true,
    },
    sentBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);
