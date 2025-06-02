const Post = require('../models/Post.js')
const logger = require('../utils/logger.js')
const { publishEvent } = require('../utils/rabbitmq.js')
const {validateCreatePost} = require('../utils/validation.js')



async function invalidatePostCache(req, input){
    const cachedKey = `post:${input}`
    await req.redisClient.del(cachedKey)

    const keys = await req.redisClient.keys('posts:*')
    if(keys.length > 0){
        await req.redisClient.del(keys)
    }
}

const createPost = async (req, res)=>{
    logger.info('Hitting creating post endpoint ...')
    try {
        //validate schema
        const {error} = validateCreatePost(req.body)
        if(error){
            logger.warn('Validation error', error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

        const {content, mediaIds} = req.body
        const newPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || [],
        })
    
        await newPost.save()

        await publishEvent('post.created', {
            postId: newPost._id.toString(),
            userId: newPost.user.toString(),
            content: newPost.content,
            createdAt: newPost.createdAt
        })


        await invalidatePostCache(req, newPost._id.toString())  //clear cache everytime a new post is created

        logger.info(`New post created by ${req.user.userId}`)
        res.status(201).json({
            success: true,
            message: 'New post created successfully',
            newPost
        })
        
    } catch (error) {
        logger.error('Error creating post', error)
        res.status(500).json({
            success: false,
            message: `Internal server error: ${error}`
        })
    }
}

const getAllPosts = async (req, res)=>{
    logger.info('Hitting get posts url...')
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;   //number of documents
        const skip = (page-1) * limit;

        //caching in redis
        const cacheKey = `post:${page}:${limit}`
        const cachedPosts = await req.redisClient.get(cacheKey)

        if(cachedPosts){
            return res.json(JSON.parse(cachedPosts))
        }

        const posts = await Post.find({}).sort({createdAt:-1}).skip(skip).limit(limit)

        const totalPosts = await Post.countDocuments()

        const result = {
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts/limit),
            totalPost: totalPosts
        }

        //save your post/result in redis client
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result))

        res.status(200).json({
            success: true,
            result
        })

        
    } catch (error) {
        logger.error('Error retrieving posts', error)
        res.status(500).json({
            success: false,
            message: `Internal server error: ${error}`
        })
    }
}


const getPost = async (req, res)=>{
    try {

        const postId = req.params.id
        const cacheKey = `post:${postId}`
        const cachedPost = await req.redisClient.get(cacheKey)

        if(cachedPost){
            return res.json(JSON.parse(cachedPost))
        }

        const singlePost = await Post.findById(postId)

        if(!singlePost){
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            })
        }

        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePost))

        res.status(200).json({
            success: true,
            singlePost
        })
        
    } catch (error) {
        logger.error('Error retrieving post', error)
        res.status(500).json({
            success: false,
            message: `Internal server error: ${error}`
        })
    }
}

const deletePost = async (req, res)=>{
    logger.info('Hitting the delete endpoint...')
    try {

        const post = await Post.findOneAndDelete({  //this is to ensure only user who created a post can also delete
            _id: req.params.id,
            user: req.user.userId
        })

        if(!post){
            return res.status(404).json({
                success: false,
                message: 'No post found'
            })
        }

        //publish "post delete" method
        await publishEvent('post.deleted', {
            postId: post._id.toString(),
            userId: req.user.userId,
            mediaIds: post.mediaIds
        })

        await invalidatePostCache(req, req.params.id)

        res.status(200).json({
            success: false,
            message: 'post deleted successfully'
        })
        
    } catch (error) {
        logger.error('Error deleting posts', error)
        res.status(500).json({
            success: false,
            message: `Internal server error: ${error}`
        })
    }
}


module.exports = {createPost, getAllPosts, getPost, deletePost}



