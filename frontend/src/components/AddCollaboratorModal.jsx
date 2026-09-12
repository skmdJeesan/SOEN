import { useEffect } from 'react'
import { useState } from 'react'
import axios from '../config/axios.js'
import { X, Check, Search, User } from 'lucide-react'

const Modal = ({modalOpen, setModalOpen, projectData, setProjectData}) => {
    const [allUsers, setAllUsers] = useState([])
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUserIds, setSelectedUserIds] = useState([])
    const [adding, setAdding] = useState(false)
    const [modalError, setModalError] = useState('')

    // Fetch all registered users once the modal opens
    useEffect(() => {
        if (!modalOpen) return

        const fetchUsers = async () => {
            setLoadingUsers(true)
            setModalError('')
            try {
                // Adjust this endpoint to match your backend, e.g. GET /users/all
                    const { data } = await axios.get('/users/all')
                    setAllUsers(data.users || [])
            } catch (error) {
                console.error('Error fetching users:', error)
                setModalError('Could not load users. Try again.')
            } finally {
                setLoadingUsers(false)
            }
        }

        fetchUsers()
    }, [modalOpen])

    const existingCollaboratorIds = (projectData.users || []).map(u => u._id)

    const filteredUsers = allUsers
        .filter(u => !existingCollaboratorIds.includes(u._id))
        .filter(u => u.isVerified) // Only show verified users 
        .filter(u => {
            const q = searchQuery.trim().toLowerCase()
            if (!q) return true
            return (
                u.username?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q)
            )
        })

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        )
    }

    const closeModal = () => {
        setModalOpen(false)
        setSearchQuery('')
        setSelectedUserIds([])
        setModalError('')
    }

    const handleAddCollaborators = async () => {
        if (selectedUserIds.length === 0) return
        setAdding(true)
        setModalError('')
        try {
            // Adjust this endpoint to match your backend, e.g. POST /projects/add-user
            const { data } = await axios.put('/projects/add-user', {
                project_id: projectData._id,
                users: selectedUserIds,
            })

            setProjectData(data.project)

            closeModal()
        } catch (error) {
            console.error('Error adding collaborators:', error)
            setModalError('Could not add collaborators. Try again.')
        } finally {
            setAdding(false)
        }
    }
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="w-full max-w-md bg-zinc-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <h2 className="font-semibold text-sm uppercase tracking-wide">Add Collaborators</h2>
                    <div onClick={closeModal}
                        className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-zinc-700 cursor-pointer">
                        <X size={16} />
                    </div>
                </header>

                <div className="p-5">
                    <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by username or email"
                            autoFocus
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-yellow-500/50 transition-colors placeholder-zinc-500"
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto flex flex-col gap-2 pr-1">
                        {loadingUsers && (
                            <p className="text-xs text-zinc-500 text-center py-6">Loading users…</p>
                        )}

                        {!loadingUsers && filteredUsers.length === 0 && (
                            <p className="text-xs text-zinc-500 text-center py-6">No users found</p>
                        )}

                        {!loadingUsers && filteredUsers.map((u) => {
                            const isSelected = selectedUserIds.includes(u._id)
                            return (
                                <div
                                    key={u._id}
                                    onClick={() => toggleUserSelection(u._id)}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer border transition-colors ${isSelected
                                            ? 'bg-yellow-500/10 border-yellow-500/40'
                                            : 'bg-zinc-900 border-white/5 hover:bg-zinc-700/60'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                                            <User size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm truncate">{u.username}</p>
                                            <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                                        </div>
                                    </div>
                                    <div
                                        className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-zinc-600'
                                            }`}
                                    >
                                        {isSelected && <Check size={10} className="text-black" />}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {modalError && (
                        <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            {modalError}
                        </p>
                    )}
                </div>

                <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 bg-zinc-800/60">
                    <button
                        onClick={closeModal}
                        className="text-xs text-zinc-400 hover:text-white px-3 py-2 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddCollaborators}
                        disabled={selectedUserIds.length === 0 || adding}
                        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                        {adding ? 'Adding…' : `Add${selectedUserIds.length > 0 ? ` (${selectedUserIds.length})` : ''}`}
                    </button>
                </footer>
            </div>
        </div>
    )
}

export default Modal