const logger = require('../utils/logger.js')

const authenticateRequest = async (req, res, next)=>{
    const userId = req.headers['x-user-id']

    if(!userId){
        logger.warn('Attempted access without authentication')
        return res.status(401).json({
            success: false,
            message: 'Authentication required, please login to continue'
        })
    }

    req.user = {userId};
    
    next()
}

module.exports = {authenticateRequest};