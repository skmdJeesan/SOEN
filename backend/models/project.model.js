import mongoose from "mongoose";

const project_schema = new mongoose.Schema({
    name: {type: String, required: true, unique: [true, 'project name must be unique']},
    description: {type: String, default: ''},
    projectOwner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    users: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    filetree: {type: Object, default: {}}
}, {timestamps: true})

const Project = mongoose.model('Project', project_schema)
export default Project;