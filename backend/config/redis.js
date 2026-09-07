import Redis from 'ioredis'

const redis_client = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
})

redis_client.on('connect', () => {
    console.log('redis connected')
})

export default redis_client