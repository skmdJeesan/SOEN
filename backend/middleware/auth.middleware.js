import jwt from 'jsonwebtoken'
import redis_client from '../config/redis.js'

export const auth_user = async (req, res, next) => {
    try {
        const auth_header = req.headers.authorization
        const token = req.cookies?.token || (auth_header?.startsWith('Bearer ') ? auth_header.slice(7) : null)
        if(!token) return res.status(401).send({error: 'unauthorized user'})
        const is_blacklisted = await redis_client.get(token)
        if(is_blacklisted) return res.status(401).send({error: 'unauthorized user'})
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        res.status(401).send({error: 'unauthorized user'})
    }
}