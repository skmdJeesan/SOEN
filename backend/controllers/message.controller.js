import Message from '../models/message.model.js'

export const getProjectMessages = async (req, res) => {
    try {
        const { project_id } = req.params

        const messages = await Message.find({ project: project_id })
            .populate('sender', 'username email')
            .sort({ createdAt: 1 })
            // .limit(50)

        return res.status(200).json({ messages })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Failed to fetch messages' })
    }
}