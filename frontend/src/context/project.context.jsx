import { createContext, useState } from "react";
import axios from "../config/axios.js";
import { useEffect } from "react";

export const ProjectContext = createContext()
export const ProjectContextProvider = ({ children }) => {
    const [projects, setProjects] = useState([])
    useEffect(() => {
        const fetch_all_projects = async () => {
            try {
                const { data } = await axios.get('/projects/all')
                setProjects(data.projects)
                localStorage.setItem('projects', JSON.stringify(data.projects));
                // console.log(data.projects)
            } catch (error) {
                console.log(error)
            }
        }
        fetch_all_projects()
    }, [])

    return (
        <ProjectContext.Provider value={{ projects, setProjects }}>
            {children}
        </ProjectContext.Provider>
    )
}