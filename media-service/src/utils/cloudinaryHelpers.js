const uploadToCloudinary = async (filepath)=>{
    try {
        const result = await cloudinary.uploader.upload(filepath)

        return {
            url: result.secure_url,
            publicId: result.public_id
        }

    } catch (error) {
        console.error("Error while uploading", error)
        throw new Error("Error while uploading")
    }
}

module.exports = {uploadToCloudinary}