import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/user.context.jsx";
import { useNavigate } from "react-router-dom";
import axios from "../config/axios.js";
import { ArrowBigRight, ArrowRight, Edit2, EllipsisVertical, Plus, Trash2, User2 } from "lucide-react";
import { ProjectContext } from "../context/project.context.jsx";

const Home = () => {
  const navigate = useNavigate();

  const { userdata, setUserdata } = useContext(UserContext);
  const { projects, setProjects } = useContext(ProjectContext); // all projects where the user is a collaborator


  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // project creation modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // project edit modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // project delete modal

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectId, setProjectId] = useState(null); // for editing a project

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
    // console.log({ projectName });
    try {
      const { data } = await axios.post("/projects/create", {
        name: projectName,
        description: projectDescription,
      });
      window.location.reload()
      setIsCreateModalOpen(false);
      // console.log(data);
    } catch (error) {
      console.log(error);
      setIsCreateModalOpen(false);
    }
  };

  const editProject = async (e) => {
    e.preventDefault();
    // console.log({ projectName });
    try {
      const { data } = await axios.put("/projects/edit", {
        project_id: projectId,
        name: projectName,
        description: projectDescription,
      });
      window.location.reload(); // Refresh the page to reflect the updated project details
      setIsEditModalOpen(false);
      // console.log(data);
    } catch (error) {
      console.log(error);
      setIsEditModalOpen(false);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const { data } = await axios.delete(`/projects/${projectId}`);
      window.location.reload(); // Refresh the page to reflect the deleted project
      // console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  const selectedProject = projects.find((project) => project._id === projectId);
  const selectedProjectIsOwned = String(selectedProject?.projectOwner?._id) === String(userdata?._id);

  return (
    <div className="px-4 sm:px-16 py-2 bg-grid min-h-screen text-white/90 flex flex-col justify-between">
      {/* grid background */}
      {/* <div className="absolute inset-0 bg-grid -z-10" /> */}
      <div className="nav flex items-start justify-between py-3">
        <h2 className="font-semibold font-sans text-xl max-w-20 sm:max-w-sm">
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

      <div className="mt-0 min-h-[85vh]">
        <div className="projects mt-1 sm:mt-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="project flex items-center gap-2 bg-white/10 p-3 sm:p-5 hover:bg-white/20 cursor-pointer"
          >
            <Plus size={20} />
            <h2 className="text-sm sm:text-base">Create New Project</h2>
          </button>

          <div className="flex gap-4 flex-wrap mt-4 w-full h-full mb-10 sm:mb-0">
            {projects.length > 0 ? projects.map((project) => (
              <div
                key={project._id}
                className="overflow-auto scrollbar-hide project flex flex-col justify-between cursor-pointer p-3 sm:p-4 rounded-3xl w-full sm:w-70 max-h-45 bg-white/10 hover:scale-102 transition-all"
              >

                <div className="flex items-center justify-between mb-1 bg-zinc-50/10 p-2 rounded-xl">
                  <h2 className="font-semibold text-sm sm:text-base">
                    {project.name}
                  </h2>
                  <div className="flex items-center gap-1">
                    <div onClick={() => {
                      setIsEditModalOpen(true); setProjectName(project.name);
                      setProjectDescription(project.description); setProjectId(project._id);
                    }}
                      className="h-6 w-6 rounded-full flex items-center justify-center bg-yellow-500/10 hover:bg-yellow-500/50 cursor-pointer">
                      <Edit2 size={12} />
                    </div>
                    <div
                      onClick={() => { setIsDeleteModalOpen(true); setProjectId(project._id); }}
                      title={String(project?.projectOwner?._id) === String(userdata?._id) ? "Delete project" : "Leave project"}
                      className="h-6 w-6 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/50 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </div>
                    <div onClick={() => { navigate(`/project`, { state: { project } }); }}
                      className="h-6 w-6 rounded-full flex items-center justify-center bg-zinc-200/10 hover:bg-zinc-200 hover:text-black cursor-pointer">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-200 tracking-tight mb-1">
                  {project?.description || "No description provided."}
                </p>
                <p className="text-sm text-gray-400">
                  Owner: {project?.projectOwner?.username || "Unknown"}
                </p>
                <p className="text-sm text-gray-400">
                  Created: {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : "Unknown"}
                </p>
                <div className="flex gap-4 items-center mt-2">
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
            )) :
              <p className="text-zinc-400 w-full text-left sm:text-center mt-0 sm:mt-[25vh]">You don't have any projects yet!</p> 
            }
          </div>
        </div>
        {isCreateModalOpen && (
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-yellow-400 ml-2">
                    Project Description
                  </label>
                  <textarea
                    onChange={(e) => setProjectDescription(e.target.value)}
                    value={projectDescription}
                    className="mt-1 block w-full p-2 bg-zinc-800 rounded-xl"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="mr-3 hover:text-red-400 cursor-pointer"
                    onClick={() => setIsCreateModalOpen(false)}
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
        {isEditModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70">
            <div className="bg-zinc-900 p-6 rounded-3xl shadow-md w-[90%] sm:w-1/3">
              <h2 className="text-xl mb-4 text-yellow-500">
                Edit Project
              </h2>
              <form onSubmit={editProject}>
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-yellow-400 ml-2">
                    Project Description
                  </label>
                  <textarea
                    onChange={(e) => setProjectDescription(e.target.value)}
                    value={projectDescription}
                    className="mt-1 block w-full p-2 bg-zinc-800 rounded-xl"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="mr-3 hover:text-red-400 cursor-pointer"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="hover:text-yellow-500 cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70">
            <div className="bg-zinc-900 p-6 rounded-3xl shadow-md w-[90%] sm:w-1/3">
              <h2 className="text-xl mb-4 text-red-400">
                {selectedProjectIsOwned ? "Confirm Delete Project" : "Leave Project"}
              </h2>
              <p className="mb-4">
                {selectedProjectIsOwned
                  ? "Are you sure you want to delete this project? This action cannot be undone."
                  : "Are you sure you want to leave this project? You can be added again later."}
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-3 hover:text-red-400 cursor-pointer"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="hover:text-yellow-500 cursor-pointer"
                  onClick={() => {
                    deleteProject(projectId);
                    setIsDeleteModalOpen(false);
                  }}
                >
                  {selectedProjectIsOwned ? "Delete" : "Leave"}
                </button>
              </div>
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
