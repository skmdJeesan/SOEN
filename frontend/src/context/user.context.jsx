import { createContext, useEffect, useState } from "react";
import axios from "../config/axios.js";

export const UserContext = createContext()
export const UserContextProvider = ({children}) => {
    
    //bcheck localStorage before defaulting to null
    const [userdata, setUserdata] = useState(() => {
        const saved_user = localStorage.getItem('user');
        if (saved_user) return JSON.parse(saved_user);
        return null;
    });

    useEffect(() => {
        const handle_session_expired = () => setUserdata(null)
        window.addEventListener('auth:expired', handle_session_expired)

        const saved_user = localStorage.getItem('user')
        const session_expires_at = Number(localStorage.getItem('sessionExpiresAt'))
        let expiry_timer

        if (session_expires_at > Date.now()) {
            expiry_timer = window.setTimeout(() => {
                localStorage.removeItem('user')
                localStorage.removeItem('token')
                window.dispatchEvent(new Event('auth:expired'))
            }, session_expires_at - Date.now())
        }

        if (saved_user) {
            axios.get('/users/profile').catch(() => {
                // The Axios interceptor clears the persisted session on 401.
            })
        }

        return () => {
            window.removeEventListener('auth:expired', handle_session_expired)
            if (expiry_timer) window.clearTimeout(expiry_timer)
        }
    }, [])

    return (
        <UserContext.Provider value={{userdata, setUserdata}}>
            {children}
        </UserContext.Provider>
    )
}