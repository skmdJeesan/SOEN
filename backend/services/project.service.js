import Project from "../models/project.model.js";

export const create_project = async ({ name, description, user_id }) => {
    if (!name) throw new Error('Name is required.')
    if (!user_id) throw new Error('User is required.')
    let project;
    try {
        project = await Project.create({ name, description, projectOwner: user_id, users: [user_id] })
    } catch (error) {
        if (error.code == 11000) {
            throw new Error('Project name already exist!')
        }
        throw error;
    }
    return project;
}

export const get_all_projects_by_userid = async ({ user_id }) => {
    if (!user_id) throw new Error('User Id is required')
    const all_projects = await Project.find({ users: user_id })
        .populate('users')
        .populate('projectOwner', 'username')
    return all_projects
}

export const add_user_to_project = async ({ project_id, users, user_id }) => {
    if (!project_id) throw new Error('project id is required')
    if (!users) throw new Error('users is required')
    if (!user_id) throw new Error('user id is required')

    const project = await Project.findOne({
        _id: project_id,
        users: user_id
    })

    if (!project) {
        throw new Error("User not belong to this project")
    }

    const updated_project = await Project.findOneAndUpdate({
        _id: project_id
    }, { $addToSet: { users: { $each: users } } }, { new: true })

    return updated_project
}

export const remove_user_from_project = async ({ project_id, remove_user_id, user_id }) => {
    if (!project_id) throw new Error('project id is required')
    if (!remove_user_id) throw new Error('user id is required')
    if (!user_id) throw new Error('user id is required')

    const project = await Project.findOne({
        _id: project_id,
        projectOwner: user_id
    })

    if (!project) {
        const error = new Error('Only the project owner can remove collaborators')
        error.status = 403
        throw error
    }

    if (project.projectOwner.toString() === remove_user_id.toString()) {
        const error = new Error('The project owner cannot be removed')
        error.status = 400
        throw error
    }

    return Project.findOneAndUpdate(
        { _id: project_id },
        { $pull: { users: remove_user_id } },
        { new: true }
    ).populate('users')
}