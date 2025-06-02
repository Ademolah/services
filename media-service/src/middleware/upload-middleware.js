const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'uploads')
    },
    filename: (req, file, cb)=>{
        cb(null, 
            file.fieldname + "-"+ Date.now()+path.extname(file.originalname)
        )
    }
})


//check the file typr and filter
const checkFileType = (req, file, cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null, true)
    }else {
        cb(new Error('This is not an image, please upload only images'))
    }
}

const multerMiddleware = multer({
    storage: storage,
    fileFilter:checkFileType,
    limits: {
        fileSize: 5 * 1024 * 1024 //this is 5MB
    }
})

module.exports = multerMiddleware;