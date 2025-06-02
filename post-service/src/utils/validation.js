
const Joi = require('joi')

const validateCreatePost = (data)=>{
    const schema = Joi.object({
        content: Joi.string().min(5).max(5000).required(),
        mediaIds: Joi.array().required()
    })

    return schema.validate(data)
}

const validateLogin = (data)=>{
    const schema = Joi.object({
        username: Joi.string().min(3).max(50),
        email: Joi.string().email(),
        password: Joi.string().min(6).required()
    })

    return schema.validate(data)
}

module.exports = {validateCreatePost}