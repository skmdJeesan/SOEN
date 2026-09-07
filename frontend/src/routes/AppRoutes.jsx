import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import { useContext } from 'react'
import { UserContext } from '../context/user.context'
import VerifyOtp from '../screens/VerifyOtp'

const AppRoutes = () => {
  const {userdata} = useContext(UserContext)
  const isloggedIn = userdata?.email
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={isloggedIn ? <Home /> : <Login />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/verify-otp' element={<VerifyOtp />} />
        <Route path='/project' element={isloggedIn ? <Project /> : <Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes