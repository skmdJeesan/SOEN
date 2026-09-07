import axios from 'axios'

const axios_instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    withCredentials: true,
})

axios_instance.interceptors.response.use(
    (response) => response,
    (error) => { 
        // when user's session expires, remove user data from localStorage and dispatch an event to notify the app
        if (error.response?.status === 401) {
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            window.dispatchEvent(new Event('auth:expired'))
        }
        return Promise.reject(error)
    }
)

export default axios_instance