const express = require('express')
const {searchPostController} = require('../controllers/search-controller')
const {authenticateRequest} = require('../middleware/authMiddleware')

const router = express.Router()

router.use(authenticateRequest)



router.get('/search', searchPostController)


module.exports = router