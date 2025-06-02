const logger = require('../utils/logger.js')
const {uploadMediaToCloudinary} = require('../utils/cloudinary.js')
const Media = require('../models/Media.js')



const uploadMedia = async(req, res)=>{
    logger.info('Hitting upload endpoint')
    try {
        console.log(req.file, "required file details")
        if(!req.file){
            logger.error('No file uploaded , kindly upload a media file')
            return res.status(400).json({
                success: false,
                message: 'Kindly upload a media file'
            })
        }

        const {originalname, mimetype, buffer} = req.file
        const userId = req.user.userId

        logger.info(`${originalname} : ${mimetype}: ${buffer}: ${userId}`)
        logger.info('upload started...')

        const uploadResult =  await uploadMediaToCloudinary(req.file)
        logger.info(`Upload successful, id: ${uploadResult.public_id}`)

        const newMedia = new Media({
            publicId: uploadResult.public_id,
            originalName: originalname,
            mimeType: mimetype,
            url: uploadResult.secure_url,
            userId
        })

        await newMedia.save()

        res.status(200).json({
            success: true,
            mediaId: newMedia._id,
            url: newMedia.url,
            message: 'Media uploaded successfully'
        })
        
    } catch (error) {
        logger.error(`Something went wrong: ${error}`)
        res.status(500).json({
            success: false,
            message: `Internal server error: ${error}`
        })
    }
}

const getAllMedia = async(req, res)=>{
    try {

        const result = await Media.find({})

        res.status(200).json({
            success: true,
            message: 'Media fetched successfully',
            result
        })
        
    } catch (error) {
        logger.error(`Error fetching media: ${error}`)
        res.status(500).json({
            success: false,
            message: `Error fetching media: ${error}`
        })
    }
}



module.exports = {uploadMedia, getAllMedia}