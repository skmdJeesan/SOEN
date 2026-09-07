import {FileCode2, Folder} from 'lucide-react'
import { FiFilePlus, FiFolderPlus } from "react-icons/fi";
import { VscRename } from "react-icons/vsc";
import { MdDeleteOutline } from "react-icons/md";

const FileTreeNode = ({ node, depth, selectedFile, onSelectFile, expandedFolders, setExpandedFolders, onStartCreate, onDelete }) => {
    
    const isFolder = node.type === 'folder'
    const isExpanded = expandedFolders.has(node.path)

    const handleDeleteClick = (e) => {
        e.stopPropagation()
        if (confirm(`Delete "${node.name}"${isFolder ? ' and everything inside it' : ''}?`)) {
            onDelete(node.path)
        }
    }

    if (isFolder) {
        return (
            <div className=''>
                <div
                    style={{ paddingLeft: depth * 14 }}
                    className="group flex items-center justify-between px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700/40 cursor-pointer rounded-lg"
                    onClick={() => {
                        setExpandedFolders((prev) => {
                            const next = new Set(prev)
                            next.has(node.path) ? next.delete(node.path) : next.add(node.path)
                            return next
                        })
                    }}
                >
                    <span className="truncate flex items-center gap-1 ml-2"><Folder size={14}/> {node.name}</span>
                    <span className="hidden group-hover:flex items-center gap-1.5">
                        <FiFilePlus size={14} className='text-white/50 hover:text-white'
                            onClick={(e) => { e.stopPropagation(); onStartCreate('file', node.path) }} 
                        />
                        <FiFolderPlus size={14} className='text-white/50 hover:text-white'
                            onClick={(e) => { e.stopPropagation(); onStartCreate('folder', node.path) }} 
                        />
                        {/* <VscRename size={14} className='text-white/50 hover:text-white'/> */}
                        <MdDeleteOutline size={16} className='text-white/50 hover:text-red-400/80'
                            onClick={handleDeleteClick}
                        />
                    </span>
                </div>
                {isExpanded && Object.values(node.children).map((child) => (
                    <FileTreeNode key={child.path} node={child} depth={depth + 1} {...{ selectedFile, onSelectFile, expandedFolders, setExpandedFolders, onStartCreate }} />
                ))}
            </div>
        )
    }

    return (
        <div
            style={{ paddingLeft: depth * 14 }}
            onClick={() => onSelectFile(node.path)}
            className={`group flex items-center justify-between px-2 py-1.5 text-sm cursor-pointer transition-colors rounded-lg ${
                selectedFile === node.path ? 'bg-yellow-500/10 text-yellow-500' : 'text-zinc-300 hover:bg-zinc-700/40'
            }`}
        >
            <span className="truncate flex items-center gap-1 ml-2"><FileCode2 size={14}/> {node.name}</span>
            <span className="hidden group-hover:flex items-center gap-1.5">
                {/* <VscRename size={14} className='text-white/50 hover:text-white'/>       */}
                <MdDeleteOutline size={16} className='text-white/50 hover:text-red-400/80'
                    onClick={handleDeleteClick}
                />
            </span>
        </div>
    )
}

export default FileTreeNode