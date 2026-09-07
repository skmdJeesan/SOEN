import { useState, useEffect, useRef } from "react";
import AddCollaboratorModal from "../components/AddCollaboratorModal.jsx";
import LeftSection from "../components/LeftSection.jsx";
import RightSection from "../components/RightSection.jsx";
import { useLocation } from "react-router-dom";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
  sendCodeChanges,
  initializeCodeEditor,
} from "../config/socket.js";
import axios from "../config/axios.js";
import { getWebContainer } from "../config/web-container.js";
import { buildWebContainerTree } from "../utils/buildWebContainerTree.js";
import { writeEntryToContainer } from "../utils/writeToContainer.js";
import { readWebContainerTree } from "../utils/readWebContainerTree.js";
import { clearContainer } from "../utils/clearContainer.js";

const Project = () => {
  const location = useLocation();
  const [projectData, setProjectData] = useState(location.state.project);
  const [modalOpen, setModalOpen] = useState(false); // add collaborator modal
  const [messages, setMessages] = useState([]);
  const [fileTree, setFileTree] = useState({});
  const [webContainer, setWebContainer] = useState(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [remoteCodeChange, setRemoteCodeChange] = useState(null);
  const [openFiles, setOpenFiles] = useState([]); // paths of files currently open in the code editor

  const socketReadyRef = useRef(false);
  const codeEditorInitializedRef = useRef(false);
  const projectLoadedRef = useRef(false);
  const mountedOnceRef = useRef(false);
  const mountedPathsRef = useRef([]);

  const saveFileTree = async (ft) => {
    try {
      const { data } = await axios.put("/projects/update-filetree", {
        project_id: projectData._id,
        filetree: ft,
      });
      setProjectData(data.project);
    } catch (error) {
      console.error("Error saving file tree:", error);
    }
  };

  const deleteFileTreePaths = async (paths) => {
    try {
      const { data } = await axios.put("/projects/delete-filetree", {
        project_id: projectData._id,
        paths,
      });
      setProjectData(data.project);
    } catch (error) {
      console.error("Error deleting file tree paths:", error);
    }
  };

  const removeCollaborator = async (user) => {
    try {
      const { data } = await axios.put("/projects/remove-user", {
        project_id: projectData._id,
        remove_user_id: user._id,
      });
      setProjectData(data.project);
    } catch (error) {
      console.error("Error removing collaborator:", error);
    }
  };

  const getProjectMessages = async () => {
    try {
      const { data: projectRes } = await axios.get(
        `/projects/get/${projectData._id}`,
      );
      const freshProject = projectRes.project;
      setProjectData(freshProject);
      projectLoadedRef.current = true;

      const { data } = await axios.get(`/messages/${projectData._id}`);
      setMessages(data.messages);

      // console.log('History messages:', data.messages);

      // The database is authoritative. An empty tree must stay empty;
      // chat history may contain old file trees and must not restore them.
      setFileTree(freshProject.filetree || {});
      setProjectLoaded(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handleIncomingMessage = async (data) => {
    // console.log('Incoming message:', data);
    setMessages((prev) => [...prev, data]);

    // if it's an AI message, try to extract fileTree and push it to RightSection
    if (data.senderType === "ai" || data.sender?._id === "soen_ai") {
      try {
        const parsed = JSON.parse(data.message);
        if (parsed.fileTree) {
          if (parsed.fileTree) {
            setFileTree((prev) => {
              const merged = { ...prev, ...parsed.fileTree };
              saveFileTree(merged);
              return merged;
            });
          }
        }
      } catch (error) {
        // plain text AI message, no fileTree to extract — safe to ignore
        console.log(error);
      }
    }
  };

  const handleSendMessage = (message, userdata) => {
    sendMessage("project-message", { message, sender: userdata });
  };

  useEffect(() => {
    getProjectMessages();
    if (!webContainer) {
      getWebContainer()
        .then(async (container) => {
          container.on("server-ready", (port, url) => {
            console.log(`[preview] server ready on port ${port}: ${url}`);
            setPreviewUrl(url);
            setIsRunning(false);
          });
          container.on("error", (err) => {
            console.error("[webcontainer error]", err.message);
          });

          try {
            await clearContainer(container); // wipe any previous project's files first
          } catch (err) {
            console.error(
              "Failed to clear container before mounting new project:",
              err,
            );
          }
          setWebContainer(container);
          console.log("web container started");
        })
        .catch((error) => {
          console.error("web container failed to start:", error);
        });
    }
    const s = initializeSocket(projectData._id);
    receiveMessage("project-message", handleIncomingMessage);
    // or s.on('project-message', handleIncomingMessage)
    s.on("code-editor:sync", ({ fileTree: syncedFileTree }) => {
      setFileTree(syncedFileTree);
      codeEditorInitializedRef.current = true;
    });
    s.on("code-editor:changes", (change) => {
      setRemoteCodeChange({ ...change, receivedAt: Date.now() });
    });
    s.on("file-tree:update", ({ path, entry }) => {
      setFileTree((prev) => {
        if (prev[path]) return prev; // already have it (e.g. it's our own echoed event) — skip
        return { ...prev, [path]: entry };
      });
      if (webContainer) writeEntryToContainer(webContainer, path, entry);
    });
    s.on("file-tree:delete", ({ paths }) => {
      setFileTree((prev) => {
        const updated = { ...prev };
        paths.forEach((p) => delete updated[p]);
        return updated;
      });
      if (webContainer && paths.length > 0) {
        // paths[0] is the root of the deletion; rm handles nested content
        webContainer.fs
          .rm(paths[0], { recursive: true, force: true })
          .catch(() => {});
      }
      setOpenFiles((prev) => prev.filter((f) => !paths.includes(f)));
    });
    socketReadyRef.current = true;
    return () => {
      socketReadyRef.current = false;
      s.off("file-tree:update");
      s.off("file-tree:delete");
      s.off("code-editor:changes");
      s.off("code-editor:sync");
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (
      !socketReadyRef.current ||
      !projectLoadedRef.current ||
      codeEditorInitializedRef.current
    )
      return;
    initializeCodeEditor(fileTree);
    codeEditorInitializedRef.current = true;
  }, [fileTree]);

  useEffect(() => {
    const webContainerMount = async () => {
      if (!webContainer || !projectLoaded || !fileTree) return;
      const paths = Object.keys(fileTree).sort();
      const pathsChanged =
        paths.length !== mountedPathsRef.current.length ||
        paths.some((path, index) => path !== mountedPathsRef.current[index]);

      if (mountedOnceRef.current && !pathsChanged) return;

      try {
        // if the container has already been mounted once,
        // we need to remove any top-level paths that are no longer present in the new fileTree
        // before mounting the new tree
        if (mountedOnceRef.current) {
          const currentTopLevelPaths = [
            ...new Set(
              mountedPathsRef.current.map((path) => path.split("/")[0]),
            ),
          ];
          const nextTopLevelPaths = new Set(
            paths.map((path) => path.split("/")[0]),
          );
          await Promise.all(
            currentTopLevelPaths
              .filter((path) => !nextTopLevelPaths.has(path))
              .map((path) =>
                webContainer.fs.rm(path, { recursive: true, force: true }),
              ),
          );
        }
        await webContainer.mount(buildWebContainerTree(fileTree));
        mountedPathsRef.current = paths;
        mountedOnceRef.current = true;
        setContainerReady(true);
      } catch (err) {
        console.error("WebContainer mount failed:", err);
      }
    };
    webContainerMount();
  }, [webContainer, fileTree, projectLoaded]);

  const terminalRef = useRef(null);
  const syncContainerTree = async () => {
    if (!webContainer) return;
    try {
      const containerTree = await readWebContainerTree(webContainer);
      setFileTree(containerTree);
      await saveFileTree(containerTree);
    } catch (error) {
      console.error("Could not sync terminal files:", error);
    }
  };

  const runCode = () => {
    if (!terminalRef.current) return;
    setIsRunning(true);
    terminalRef.current.runCommand("npm install && npm run dev");
  };

  return (
    <main className="project-shell h-screen w-screen min-h-0 flex overflow-hidden bg-zinc-900 text-white relative">
      <LeftSection
        setModalOpen={setModalOpen}
        projectData={projectData}
        messages={messages}
        onSendMessage={handleSendMessage}
        onRemoveCollaborator={removeCollaborator}
      />
      <RightSection
        fileTree={fileTree}
        setFileTree={setFileTree}
        // runCode={runCode}
        previewUrl={previewUrl}
        isRunning={isRunning}
        saveFileTree={saveFileTree}
        deleteFileTreePaths={deleteFileTreePaths}
        sendCodeChanges={sendCodeChanges}
        remoteCodeChange={remoteCodeChange}
        terminalRef={terminalRef}
        webContainer={containerReady ? webContainer : null}
        onFilesystemChange={syncContainerTree}
        openFiles={openFiles}
        setOpenFiles={setOpenFiles}
      />
      {modalOpen && (
        <AddCollaboratorModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          projectData={projectData}
          setProjectData={setProjectData}
        />
      )}
    </main>
  );
};

export default Project;
