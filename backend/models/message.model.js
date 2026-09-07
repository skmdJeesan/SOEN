import mongoose from "mongoose";

const message_schema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    senderType: { type: String, enum: ['user', 'ai'], default: 'user', required: true },
    message: { type: String, required: true }
}, { timestamps: true })

const Message = mongoose.model('Message', message_schema)
export default Message;