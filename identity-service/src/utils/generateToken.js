const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const RefreshToken = require('../models/RefreshToken.js')


const generateTokens = async (user)=>{

    //create access token
    const accessToken = jwt.sign({
        userId: user._id,
        username: user.username,
        userEmail: user.email
    }, process.env.JWT_SECRET, {expiresIn: process.env.NODE_ENV==='dev' ? '30m': '15m'})

    //create refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate()+7) //refresh token expires in 7 days


    await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiresAt
    })    

    return {accessToken, refreshToken}

}

module.exports = generateTokens;