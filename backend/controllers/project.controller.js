import { validationResult } from "express-validator";
import Project from "../models/project.model.js";
import { add_user_to_project, create_project, get_all_projects_by_userid, remove_user_from_project } from '../services/project.service.js'
import User from "../models/user.model.js";
import mongoose from "mongoose";
import { send_project_invite_email } from "../config/invite_mail.js";

export const project_create = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    try {
        const { name, description } = req.body
        const { email } = req.user
        const curr_user = await User.findOne({ email })
        const new_project = await create_project({ name, description, user_id: curr_user._id })
        res.status(201).json(new_project)
    } catch (error) {
        res.status(500).json({ message: `creating new project error: ${error}` })
    }
}

export const get_all_projects = async (req, res) => {
    try {
        const { email } = req.user
        const curr_user = await User.findOne({ email })
        const all_projects = await get_all_projects_by_userid({
            user_id: curr_user._id
        })
        return res.status(200).json({ projects: all_projects })
    } catch (error) {
        return res.status(500).json({ message: `get all projects error: ${error}` })
    }
}

export const add_user = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    try {
        const { project_id, users } = req.body
        const curr_user = await User.findOne({ email: req.user.email })
        const updated_project = await add_user_to_project({
            project_id,
            users,
            user_id: curr_user._id,
        })

        const project = await Project.findById(project_id)
            .populate('users')
            .populate('projectOwner', 'username')
        const added_users = await User.find({ _id: { $in: users } })

        await Promise.allSettled(added_users.map((member) => (
            send_project_invite_email({
                to_email: member.email,
                owner_name: project.projectOwner.username,
                project_name: project.name,
                project_id: project_id
            })
        )))

        return res.status(200).json({ project: project || updated_project })
    } catch (error) {
        return res.status(500).json({ message: `add user error: ${error}` })
    }
}

export const get_project = async (req, res) => {
    try {
        const { project_id } = req.params
        if (!project_id) throw new Error('project id is required!')
        if (!mongoose.Types.ObjectId.isValid(project_id)) {
            return res.status(400).json({ message: 'invalid project id!' })
        }
        const project = await Project.findOne({ _id: project_id })
            .populate('users')
            .populate('projectOwner', 'username')
        // if(!project) return res.status(400).json({message: `project not found!`})
        return res.status(200).json({ project })
    } catch (error) {
        return res.status(500).json({ message: `project find error: ${error.message}` })
    }
}

export const update_filetree = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    try {
        const { project_id, filetree } = req.body
        // const curr_user = await User.findOne({ email: req.user.email })
        const project = await Project.findOne({ _id: project_id })
        if (!project) return res.status(404).json({ message: 'Project not found' })

        const updatedProject = await Project.findByIdAndUpdate(
            project_id,
            { filetree },
            { new: true }
        )
        return res.status(200).json({ message: 'Filetree updated successfully', project: updatedProject })
    } catch (error) {
        return res.status(500).json({ message: `update filetree error: ${error.message}` })
    }
}

export const delete_filetree_paths = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    try {
        const { project_id, paths } = req.body
        const project = await Project.findOne({ _id: project_id })
        if (!project) return res.status(404).json({ message: 'Project not found' })

        const deletedTree = Object.fromEntries(
            Object.entries(project.filetree || {}).filter(([treePath]) => (
                !paths.some((path) => treePath === path || treePath.startsWith(`${path}/`))
            ))
        )

        const updatedProject = await Project.findByIdAndUpdate(
            project_id,
            { filetree: deletedTree },
            { new: true }
        )
        return res.status(200).json({ message: 'Paths deleted successfully', project: updatedProject })
    } catch (error) {
        return res.status(500).json({ message: `delete filetree error: ${error.message}` })
    }
}

export const remove_user = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    try {
        const { project_id, remove_user_id } = req.body
        const curr_user = await User.findOne({ email: req.user.email })
        const updated_project = await remove_user_from_project({
            project_id,
            remove_user_id,
            user_id: curr_user._id,
        })
        return res.status(200).json({ project: updated_project })
    } catch (error) {
        return res.status(error.status || 500).json({ message: `remove user error: ${error.message}` })
    }
}

export const update_project = async (req, res) => {
    try {
        const { project_id, name, description } = req.body
        if (!project_id) throw new Error('project id is required!')
        if (!mongoose.Types.ObjectId.isValid(project_id)) {
            return res.status(400).json({ message: 'invalid project id!' })
        }
        const updatedProject = await Project.findByIdAndUpdate(
            project_id,
            { name, description },
            { new: true }
        )
        if (!updatedProject) return res.status(404).json({ message: 'Project not found' })
        return res.status(200).json({ message: 'Project updated successfully', project: updatedProject })
    } catch (error) {
        return res.status(500).json({ message: `update project error: ${error.message}` })
    }
}

export const delete_project = async (req, res) => {
    try {
        const { project_id } = req.params
        if (!project_id) throw new Error('project id is required!')
        if (!mongoose.Types.ObjectId.isValid(project_id)) {
            return res.status(400).json({ message: 'invalid project id!' })
        }
        const current_user = await User.findOne({ email: req.user.email })
        const project = await Project.findById(project_id)
        if (!project) return res.status(404).json({ message: 'Project not found' })
        if (!current_user) return res.status(401).json({ message: 'User not found' })

        if (project.projectOwner.toString() !== current_user._id.toString()) {
            await Project.findByIdAndUpdate(project_id, {
                $pull: { users: current_user._id }
            })
            return res.status(200).json({ message: 'You left the project' })
        }

        const deletedProject = await Project.findByIdAndDelete(project_id)
        if (!deletedProject) return res.status(404).json({ message: 'Project not found' })
        return res.status(200).json({ message: 'Project deleted successfully', project: deletedProject })
    } catch (error) {
        return res.status(500).json({ message: `delete project error: ${error.message}` })
    }
}