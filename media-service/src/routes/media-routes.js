const express = require('express')
const multer = require('multer')
const {uploadMedia, getAllMedia} = require('../controllers/media-controller.js')

const {authenticateRequest} = require('../middleware/authMiddleware.js')
const logger = require('../utils/logger.js')
const uploadMiddleware = require('../middleware/upload-middleware.js')

const router = express.Router()




// configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5*1024*1024    //5mb
    }
}).single('file')


router.post('/upload',authenticateRequest , (req,res,next)=>{
    upload(req,res, function(err){
        if(err instanceof multer.MulterError){
            logger.error(`Multer error, ${err}`)
            return res.status(400).json({
                message: 'Multer error',
                error: err.message,
                stack: err.stack
            })
        }else if(err){
            logger.error(`Unknown error occured, ${err}`)
            return res.status(500).json({
                message: 'Unknown error',
                error: err.message,
                stack: err.stack
            })
        }

        if(!req.file){
            logger.error(`No file uploaded, ${err}`)
            return res.status(400).json({
                message: 'No file uploaded',
            })
        }

        next()
    })
}, uploadMedia)

router.get('/fetch', authenticateRequest, getAllMedia)



module.exports = router