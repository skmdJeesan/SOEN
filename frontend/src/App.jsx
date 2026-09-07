import React from 'react'
import AppRoutes from './routes/AppRoutes'
import { UserContextProvider } from './context/user.context'
import { ProjectContextProvider } from './context/project.context'

const App = () => {
  return (
    <UserContextProvider>
      <ProjectContextProvider>
        <AppRoutes />
      </ProjectContextProvider>
    </UserContextProvider>
  )
}

export default App