const logger = require('../utils/logger.js')



const errorHandler = (err, req, res, next)=>{
    logger.error(err.stack)

    res.status(500 || err.status).json({
        message: err.message || 'Internal server error'
    })
}


module.exports = errorHandler