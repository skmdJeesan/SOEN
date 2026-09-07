import * as ai from "../services/ai.service.js"

export const get_ai_response = async (req, res) => {
    try {
        const {prompt} = req.body
        if(prompt.trim() == '') return res.status(400).json({message: `give some valid prompt`})
        const response = await ai.generate_response(prompt)
        if(!response) return res.status(400).json({message: `network error`})
        return res.status(200).json({response})
    } catch (error) {
        return res.status(500).json({message: `Ai response error: ${error}`})
    }
}