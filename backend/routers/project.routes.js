import {Router} from 'express'
import { add_user, delete_filetree_paths, get_all_projects, get_project, project_create, remove_user, update_filetree } from '../controllers/project.controller.js'
import {body} from 'express-validator'
import { auth_user } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/create', 
    body('name').isString().withMessage('Name is required.'),
    auth_user,
    project_create
)

router.get('/all', auth_user, get_all_projects)
router.put('/add-user',
    auth_user,
    body('project_id').isString().withMessage('project id is required'),
    body('users').isArray({min: 1}).withMessage('users must be an array of strings').bail()
    .custom((users) => users.every(user => typeof user === 'string')).withMessage('each user must be a string'),
    add_user
)
router.put('/remove-user',
    auth_user,
    body('project_id').isString().withMessage('project id is required'),
    body('remove_user_id').isString().withMessage('user id is required'),
    remove_user
)
router.get('/get/:project_id', auth_user, get_project)
router.put('/update-filetree',
    auth_user, 
    body('project_id').isString().withMessage('project id is required'),
    body('filetree').isObject().withMessage('filetree must be an object'), 
    update_filetree
)
router.put('/delete-filetree',
    auth_user,
    body('project_id').isString().withMessage('project id is required'),
    body('paths').isArray({ min: 1 }).withMessage('paths must be a non-empty array'),
    delete_filetree_paths
)

export default router