const express = require('express')
const {registerUser, loginUser, refreshTokenUser, logoutUser} = require('../controllers/identity-controller.js')

const router = express.Router()


router.post('/signup', registerUser)

router.post('/login', loginUser)
router.post('/logout', logoutUser)
router.post('/refresh-token',  refreshTokenUser)




module.exports = router