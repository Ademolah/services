const express = require('express')
const {createPost, getAllPosts, getPost, deletePost} = require('../controllers/post-controller')
const {authenticateRequest} = require('../middleware/authMiddleware.js')

const router = express()


// all requests must be authenticated
router.use(authenticateRequest)

router.post('/create-post', createPost)
router.get('/get-posts', getAllPosts)
router.get('/single-post/:id', getPost)
router.post('/delete/:id', deletePost)




module.exports = router