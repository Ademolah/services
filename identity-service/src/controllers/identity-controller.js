
const logger = require('../utils/logger.js')
const {validateRegistration, validateLogin} = require('../utils/validation.js')
const User = require('../models/userModel.js')
const generateTokens = require('../utils/generateToken.js')
const argon2 = require('argon2')
const RefreshToken = require('../models/RefreshToken.js')




//user registration
const registerUser = async (req,res)=>{
    logger.info('Registration endpoint...')
    try {
        
        //validate schema
        const {error} = validateRegistration(req.body)
        if(error){
            logger.warn('Validation error', error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

        const {username, email,password} = req.body
        let user = await User.findOne({ $or: [{email}, {username}]})

        if(user){
            logger.warn('User already exists')
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            })
        }

        user = new User({username, email, password})
        await user.save()
        logger.warn('User saved successfully', user._id)

        const {accessToken, refreshToken} = await generateTokens(user)


        res.status(201).json({
            success: true,
            message: 'User created successfully',
            refreshToken,
            accessToken
        })

    } catch (error) {
        logger.error('Registration error', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

//user login
const loginUser = async (req, res)=>{
    logger.info('login endpoint hit...')

    try {
        const {error} = validateLogin(req.body)
        if(error){
            logger.warn('Validation error', error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

        const {username, email, password} = req.body 

        const user = await User.findOne({$or: [{username}, {email}]})

        if(!user){
            logger.warn(`User does not exist`)
            return res.status(401).json({
                success: false,
                message: `Invalid credentials`
            })
        }

        //valid password
        const isValidPassword = await user.comparePassword(password) 
        if(!isValidPassword){
            logger.warn(`Invalid password`)
            return res.status(400).json({
                success: false,
                message: `Invalid password`
            })
        }

        const {accessToken, refreshToken} = await generateTokens(user)

        res.status(200).json({
            success: true,
            message: `Login successfully`,
            accessToken,
            refreshToken,
            userId: user._id
        })
        
    } catch (error) {
        logger.error('login error', error)
        res.status(500).json({
            success: false,
            message: `Internal server error(login): ${error}`
        })
    }
}


//refresh token
const refreshTokenUser = async (req, res)=>{
    logger.info('Hitting refresh token endpoint...')
    try {

        const {refreshToken} = req.body
        if(!refreshToken){
            logger.warn('refresh token missing')
            return res.status(400).json({
                success: false,
                message: 'refresh token missing'
            })
        }

        const storedToken = await RefreshToken.findOne({token: refreshToken})

        if(!storedToken || storedToken.expiresAt < new Date()){   //if the refresh token has been created more than 7 days or it doesnt exist
            logger.warn(`Invalid or expired refresh token`)

            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            })
        }

        const user = await User.findById(storedToken.user)

        if(!user){
            logger.warn('User not found')
            return res.status(401).json({
                success: false,
                message: 'No user found'
            })
        }

        //generate new refresh token
        const {accessToken: newAccessToken, refreshToken: newRefreshToken} = await generateTokens(user)

        //delete the old token
        await RefreshToken.deleteOne({_id: storedToken._id})

        res.status(200).json({
            success: true,
            message: 'Tokens generated',
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
        
    } catch (error) {
        logger.error('refresh token error', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}


//user logout
const logoutUser = async (req, res)=>{
    logger.info('logout endpoint hit...')

    try {

        const {refreshToken} = req.body

        if(!refreshToken){
            logger.warn('refresh token not present')
            return res.status(401).json({
                success: false,
                message: 'refresh token not present'
            })
        }

        const user = await RefreshToken.findOne({token: refreshToken})

        //delete the refresh token from database
        await RefreshToken.deleteOne({token: refreshToken})
        
        logger.info(`Refresh token deleted for user with id ${user._id}`)

        res.status(200).json({
            success: true,
            message: `${user._id} has been logged out successfully`
        })

        
    } catch (error) {
        logger.error('logout error', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

module.exports = {registerUser, loginUser, refreshTokenUser, logoutUser}