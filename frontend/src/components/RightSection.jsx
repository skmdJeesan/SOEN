import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { File, Menu, Pause, Play, X } from "lucide-react";
import { VscLayoutPanel, VscLayoutPanelOff } from "react-icons/vsc";
import { FiFilePlus, FiFolderPlus } from "react-icons/fi";
import FileTreeNode from "./FileTreeNode.jsx";
import { sendFileTreeDelete, sendFileTreeUpdate } from "../config/socket.js";
import TerminalPanel from "./TerminalPanel.jsx";
import { buildTree } from "../utils/buildTree.js";
import { writeEntryToContainer } from "../utils/writeToContainer.js";
import { collectDescendantPaths } from "../utils/collectDescendantPaths.js";

const LANGUAGE_MAP = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  json: "json",
  html: "html",
  css: "css",
  md: "markdown",
};

const getLanguage = (filename) => {
  const ext = filename.split(".").pop();
  return LANGUAGE_MAP[ext] || "plaintext";
};

const RightSection = ({
  fileTree,
  setFileTree,
  previewUrl,
  isRunning,
  saveFileTree,
  deleteFileTreePaths,
  sendCodeChanges,
  remoteCodeChange,
  terminalRef,
  webContainer,
  onFilesystemChange,
  openFiles,
  setOpenFiles,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [bottomTab, setBottomTab] = useState("terminal");
  const [showTerminal, setShowTerminal] = useState(true);
  const [explorerOpen, setExplorerOpen] = useState(false); // mobile drawer state
  const editorRef = useRef(null);
  const suppressChangesRef = useRef(false); // to prevent infinite loops when applying remote changes to the editor
  const selectedFileRef = useRef(null);
  const fileTreeRef = useRef(fileTree);

  const fileNames = Object.keys(fileTree || {}).filter(
    (path) => fileTree[path]?.type === "file",
  );
  const activeFile =
    fileTree[selectedFile]?.type === "file"
      ? selectedFile
      : fileNames[0] || null;

  useEffect(() => {
    selectedFileRef.current = activeFile;
  }, [activeFile]);

  useEffect(() => {
    fileTreeRef.current = fileTree;
  }, [fileTree]);

  const saveTimeoutRef = useRef(null);

  const containerWriteQueueRef = useRef(Promise.resolve());
  const updateFileContents = (filename, contents) => {
    setFileTree((currentFileTree) => {
      if (currentFileTree[filename]?.type !== "file") return currentFileTree;
      const updated = {
        ...currentFileTree,
        [filename]: {
          type: "file",
          file: { ...currentFileTree[filename]?.file, contents },
        },
      };
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveFileTree(updated), 800);
      if (webContainer) {
        containerWriteQueueRef.current = containerWriteQueueRef.current
          .then(() =>
            writeEntryToContainer(webContainer, filename, updated[filename]),
          )
          .catch((err) => console.error("Failed to write to container:", err));
      }
      return updated;
    });
  };

  const applyChanges = (contents, changes) =>
    [...changes]
      .sort((left, right) => right.rangeOffset - left.rangeOffset)
      .reduce(
        (currentContents, change) =>
          currentContents.slice(0, change.rangeOffset) +
          change.text +
          currentContents.slice(change.rangeOffset + change.rangeLength),
        contents,
      );

  useEffect(() => {
    if (!remoteCodeChange || remoteCodeChange.filename !== activeFile) {
      if (remoteCodeChange && fileTreeRef.current[remoteCodeChange.filename]) {
        const currentContents =
          fileTreeRef.current[remoteCodeChange.filename].file?.contents || "";
        updateFileContents(
          remoteCodeChange.filename,
          applyChanges(currentContents, remoteCodeChange.changes),
        );
      }
      return;
    }
    if (!editorRef.current) return;

    suppressChangesRef.current = true;
    const model = editorRef.current.getModel();
    const edits = remoteCodeChange.changes.map(
      ({ rangeOffset, rangeLength, text }) => {
        const start = model.getPositionAt(rangeOffset);
        const end = model.getPositionAt(rangeOffset + rangeLength);
        return {
          range: {
            startLineNumber: start.lineNumber,
            startColumn: start.column,
            endLineNumber: end.lineNumber,
            endColumn: end.column,
          },
          text,
        };
      },
    );
    editorRef.current.executeEdits("remote", edits);
    updateFileContents(remoteCodeChange.filename, editorRef.current.getValue());
    suppressChangesRef.current = false;
  }, [remoteCodeChange, activeFile]);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeModelContent((event) => {
      const filename = selectedFileRef.current;
      if (!filename || suppressChangesRef.current) return;
      if (fileTreeRef.current[filename]?.type !== "file") return;

      const changes = event.changes
        .map(({ rangeOffset, rangeLength, text }) => ({
          rangeOffset,
          rangeLength,
          text,
        }))
        .sort((left, right) => right.rangeOffset - left.rangeOffset);
      updateFileContents(filename, editor.getValue());
      sendCodeChanges({ filename, changes });
    });
  };

  const [creating, setCreating] = useState(null); // { type: 'file' | 'folder', parentPath: string } | null
  const [newItemName, setNewItemName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set([""]));

  const handleCreateItem = () => {
    if (!creating || !newItemName.trim()) return;
    const trimmedName = newItemName.trim();
    const fullPath = creating.parentPath
      ? `${creating.parentPath}/${trimmedName}`
      : trimmedName;

    if (fileTree[fullPath]) {
      alert("A file/folder with that name already exists here.");
      return;
    }

    const newEntry =
      creating.type === "file"
        ? { type: "file", file: { contents: "" } }
        : { type: "folder" };

    const updatedTree = { ...fileTree, [fullPath]: newEntry };

    setFileTree(updatedTree);
    saveFileTree(updatedTree);
    sendFileTreeUpdate({ path: fullPath, entry: newEntry });
    if (webContainer) writeEntryToContainer(webContainer, fullPath, newEntry);

    if (creating.type === "file") {
      setOpenFiles((currentOpenFiles) => [...currentOpenFiles, fullPath]);
      selectedFileRef.current = fullPath;
      setSelectedFile(fullPath);
    }
    setCreating(null);
    setNewItemName("");
  };

  const openFile = (filename) => {
    selectedFileRef.current = filename;
    setOpenFiles((currentOpenFiles) =>
      currentOpenFiles.includes(filename)
        ? currentOpenFiles
        : [...currentOpenFiles, filename],
    );
    setSelectedFile(filename);
    setExplorerOpen(false); // auto-close mobile drawer once a file is picked
  };

  const closeFile = (filename) => {
    setOpenFiles((currentOpenFiles) => {
      const nextOpenFiles = currentOpenFiles.filter(
        (file) => file !== filename,
      );
      if (activeFile === filename) {
        const nextActiveFile = nextOpenFiles[nextOpenFiles.length - 1] || null;
        selectedFileRef.current = nextActiveFile;
        setSelectedFile(nextActiveFile);
      }
      return nextOpenFiles;
    });
  };

  buildTree(fileTree);
  const tabFiles =
    activeFile && !openFiles.includes(activeFile)
      ? [...openFiles, activeFile]
      : openFiles;

  const handleRunFile = async () => {
    if (!activeFile) return;
    if (webContainer && fileTree[activeFile]) {
      await writeEntryToContainer(
        webContainer,
        activeFile,
        fileTree[activeFile],
      );
    }
    const extension = activeFile.split(".").pop()?.toLowerCase();
    const command =
      extension === "html"
        ? "npx --yes serve . -s 5174 --no-clipboard"
        : `node "${activeFile}"`;
    terminalRef.current?.runCommand(command);
  };

  const handleDeleteItem = async (path) => {
    const pathsToRemove = collectDescendantPaths(fileTree, path);

    const updatedTree = { ...fileTree };
    pathsToRemove.forEach((p) => delete updatedTree[p]);

    clearTimeout(saveTimeoutRef.current);
    setFileTree(updatedTree);
    await deleteFileTreePaths(pathsToRemove); // persist to DB
    sendFileTreeDelete({ paths: pathsToRemove }); // broadcast

    if (webContainer) {
      webContainer.fs
        .rm(path, { recursive: true, force: true })
        .catch((err) => console.error("Failed to remove from container:", err));
    }

    // close any open tabs for deleted files
    setOpenFiles((prev) => prev.filter((f) => !pathsToRemove.includes(f)));
    if (pathsToRemove.includes(activeFile)) {
      setSelectedFile(null);
    }
  };

  // shared bottom tab bar (Terminal / Preview) — used in both the
  // "file open" and "no file open" render branches below
  const renderBottomPanel = () => (
    <div className="flex-1 border-t border-white/10 bg-zinc-900/60 flex flex-col min-h-0 scrollbar-hide">
      <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-1.5 sm:py-[9px] border-b border-white/10 text-[14px]">
        <button
          onClick={() => setBottomTab("terminal")}
          className={`${bottomTab === "terminal" ? "text-yellow-500" : "text-zinc-400"} hover:text-yellow-500 transition-colors`}
        >
          Terminal
        </button>
        <button
          onClick={() => setBottomTab("preview")}
          className={`${bottomTab === "preview" ? "text-yellow-500" : "text-zinc-400"} hover:text-yellow-500 transition-colors`}
        >
          Preview
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {bottomTab === "terminal" ? (
          <TerminalPanel
            webContainer={webContainer}
            onFilesystemChange={onFilesystemChange}
            ref={terminalRef}
          />
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="WebContainer Preview"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500 text-xs sm:text-sm text-center px-4">
            Preview will appear here once the server is ready.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="right h-full min-h-0 w-full md:w-[75%] shrink-0 bg-zinc-800/70 backdrop-blur-sm flex grow relative border-r border-white/10 overflow-hidden">
      {/* Mobile / tablet explorer toggle button */}
      <button
        onClick={() => setExplorerOpen(true)}
        aria-label="Open file explorer"
        className="md:hidden absolute top-1 left-1 z-30 h-6 w-6 rounded-md bg-zinc-900/90 border border-white/10 flex items-center justify-center text-white hover:text-yellow-400 transition-colors"
      >
        <Menu size={14} />
      </button>

      {/* Backdrop for the mobile/tablet drawer */}
      {explorerOpen && (
        <div
          onClick={() => setExplorerOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      <div
        className={`explorer h-full w-64 sm:w-72 md:w-[26%] lg:w-[20%] border-r border-white/10 flex flex-col bg-zinc-900 md:bg-zinc-900/40
          fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out
          ${explorerOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <header className="flex items-center justify-between px-2 sm:px-3 py-1 sm:py-2 border-b border-white/10">
          <div className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-wide">
            Explorer
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCreating({ type: "file", parentPath: "" })}
              className="h-6 w-6 rounded-full flex items-center justify-center text-white hover:text-yellow-400 hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
            >
              <FiFilePlus size={15} />
            </button>
            <button
              onClick={() => setCreating({ type: "folder", parentPath: "" })}
              className="h-6 w-6 rounded-full flex items-center justify-center text-white hover:text-yellow-400 hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
            >
              <FiFolderPlus size={15} />
            </button>
            <button
              onClick={() => setExplorerOpen(false)}
              aria-label="Close file explorer"
              className="md:hidden h-6 w-6 rounded-full flex items-center justify-center text-white hover:text-yellow-400 hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        </header>
        <div className="file-tree flex flex-col overflow-y-auto grow py-1 px-2">
          {Object.values(buildTree(fileTree)).map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              depth={0}
              selectedFile={activeFile}
              onSelectFile={openFile}
              expandedFolders={expandedFolders}
              setExpandedFolders={setExpandedFolders}
              onStartCreate={(type, parentPath) =>
                setCreating({ type, parentPath })
              }
              onDelete={handleDeleteItem}
            />
          ))}
          {creating && (
            <div style={{ paddingLeft: 12 }} className="px-3 py-1">
              <input
                autoFocus
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateItem()}
                onBlur={() => {
                  setCreating(null);
                  setNewItemName("");
                }}
                placeholder={
                  creating.type === "file" ? "filename.js" : "folder name"
                }
                className="w-full bg-zinc-800 text-xs text-white px-2 py-1 rounded outline-none border border-yellow-500/40"
              />
            </div>
          )}
        </div>
      </div>

      <div className="code-editor h-full w-[90%] sm:w-full min-w-0 flex flex-col">
        {activeFile ? (
          <>
            <div className="flex items-center justify-between pl-10 md:pl-2 pr-2 sm:pr-6 border-b border-white/10">
              <div className="flex items-center min-w-0 overflow-x-auto scroll-auto scrollbar-hide">
                {tabFiles.map((filename) => (
                  <div
                    key={filename}
                    onClick={() => openFile(filename)}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 border-r border-white/10 cursor-pointer shrink-0 ${activeFile === filename ? "bg-zinc-800 text-yellow-500" : "bg-zinc-900/40 text-zinc-400 hover:text-white"}`}
                  >
                    <File size={13} className="hidden sm:block" />
                    <span className="max-w-24 sm:max-w-40 truncate text-xs sm:text-sm">
                      {filename}
                    </span>
                    <button
                      type="button"
                      aria-label={`Close ${filename}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        closeFile(filename);
                      }}
                      className="text-zinc-500 hover:text-white cursor-pointer mt-0.5"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  onClick={handleRunFile}
                  disabled={isRunning}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-white hover:text-yellow-400 hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
                >
                  {isRunning ? <Pause size={14} /> : <Play size={16} />}
                </button>
                <button
                  onClick={() => setShowTerminal((prev) => !prev)}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-white hover:text-yellow-400 hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
                >
                  {showTerminal ? (
                    <VscLayoutPanel size={16} />
                  ) : (
                    <VscLayoutPanelOff size={16} />
                  )}
                </button>
              </div>
            </div>
            <div
              className={`${showTerminal ? "h-[55%] sm:h-[50%]" : "h-full"}`}
            >
              <Editor
                path={activeFile}
                height="100%"
                language={getLanguage(activeFile)}
                value={fileTree[activeFile]?.file?.contents || ""}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
            {showTerminal && renderBottomPanel()}
          </>
        ) : (
          <div className="flex items-center pl-10 md:pl-2 pr-2 h-10 border-b border-white/10 md:hidden" />
        )}
        {!activeFile && showTerminal && renderBottomPanel()}
      </div>
    </section>
  );
};

export default RightSection;
