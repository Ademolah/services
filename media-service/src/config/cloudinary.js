const cloudinary = require('cloudinary').v2;


//configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_PUBLIC_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET_KEY 
});

module.exports = cloudinary