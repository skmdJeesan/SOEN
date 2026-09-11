import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/user.context.jsx";
import { useNavigate } from "react-router-dom";
import axios from "../config/axios.js";
import { EllipsisVertical, Plus, User2 } from "lucide-react";
import { ProjectContext } from "../context/project.context.jsx";

const Home = () => {
  const { userdata, setUserdata } = useContext(UserContext);
  const { projects, setProjects } = useContext(ProjectContext);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false); // project creation modal
  const [projectName, setProjectName] = useState("");

  const handleLogout = async () => {
    try {
      await axios.get("/users/logout");
      localStorage.removeItem("user");
      localStorage.removeItem("sessionExpiresAt");
      setUserdata(null);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    console.log({ projectName });
    try {
      const { data } = await axios.post("/projects/create", {
        name: projectName,
      });
      setIsModalOpen(false);
      console.log(data);
    } catch (error) {
      console.log(error);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="px-4 sm:px-16 py-2 bg-zinc-900 min-h-screen text-white/90 flex flex-col justify-between">
      <div className="nav flex items-center justify-between py-3">
        <h2 className="font-semibold font-sans text-xl">
          Welcome <span className="text-yellow-500">{userdata.username}</span>
        </h2>
        <div className="flex items-center gap-4">
          <a
            href="mailto:skmdJeesan@gmail.com"
            className="cursor-pointer hover:text-yellow-500 transition-colors"
          >
            Contact
          </a>
          {userdata ? (
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer hover:text-red-500 transition-colors"
            >
              Log out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="cursor-pointer hover:text-yellow-500"
            >
              Log in
            </button>
          )}
        </div>
      </div>

      <div className="mt-0 sm:mt-2 min-h-[85vh]">
        <div className="projects mt-1 sm:mt-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="project flex items-center gap-2 bg-white/10 p-3 sm:p-5 hover:bg-white/20 cursor-pointer"
          >
            <Plus size={20} />
            <h2 className="text-sm sm:text-base">Create New Project</h2>
          </button>

          <div className="flex gap-4 flex-wrap mt-4 w-full h-full">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => {
                  navigate(`/project`, { state: { project } });
                }}
                className="project flex flex-col gap-2 cursor-pointer p-3 sm:p-5 rounded-3xl w-40 sm:w-60 h-25 bg-white/10 hover:bg-white/20 hover:scale-105 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm sm:text-base">
                    {project.name}
                  </h2>
                  <div className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-zinc-700 cursor-pointer">
                    <EllipsisVertical size={14} />
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <p>
                    {" "}
                    <small className="flex gap-1 items-center text-sm sm:text-base">
                      {" "}
                      <User2 size={14} /> Collaborators
                    </small>
                  </p>
                  {project.users.length}
                </div>
              </div>
            ))}
          </div>
        </div>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70">
            <div className="bg-zinc-900 p-6 rounded-3xl shadow-md w-[90%] sm:w-1/3">
              <h2 className="text-xl mb-4 text-yellow-500">
                Create New Project
              </h2>
              <form onSubmit={createProject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-yellow-400 ml-2">
                    Project Name
                  </label>
                  <input
                    onChange={(e) => setProjectName(e.target.value)}
                    value={projectName}
                    type="text"
                    className="mt-1 block w-full p-2 bg-zinc-800 rounded-xl"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="mr-3 hover:text-red-400 cursor-pointer"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="hover:text-yellow-500 cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      
      <footer id="footer" className="bg-zinc-900/60">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-3 text-xs sm:text-sm">
          <span className="text-zinc-500">
            &copy; 2026 SOEN. Built by{" "}
            <span className="font-medium text-yellow-500">Jeesan</span>
          </span>
          <span className="hidden sm:inline text-zinc-700">•</span>
          <a
            href="https://github.com/skmdJeesan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-yellow-500 transition-colors"
          >
            GitHub
          </a>
          <span className="text-zinc-700">•</span>
          <a
            href="https://www.linkedin.com/in/smjeesan/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-yellow-500 transition-colors"
          >
            LinkedIn
          </a>
          <span className="text-zinc-700">•</span>
          <a
            href="mailto:skmdJeesan@gmail.com"
            className="text-zinc-400 hover:text-yellow-500 transition-colors"
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
