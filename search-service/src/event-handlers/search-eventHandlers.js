const Search = require('../models/Search')
const logger = require('../utils/logger')


async function invalidatePostCache(req, input){
    const cachedKey = `post:${input}`
    await req.redisClient.del(cachedKey)

    const keys = await req.redisClient.keys('posts:*')
    if(keys.length > 0){
        await req.redisClient.del(keys)
    }
}

async function handlePostCreated(event){
    try{
        const newSearchPost = new Search({
            postId: event.postId,
            userId: event.userId,
            content: event.content,
            createdAt: event.createdAt
        })

        await newSearchPost.save()

        // //invalidate cache when new post is created
        // await invalidatePostCache()
        logger.info(`New search post created , ${event.postId}, ${newSearchPost._id.toString()}`)

    }catch(error){
        logger.error(`Something went wrong: ${error}`)
    }
}

async function handlePostDeleted(event){
    try{

        await Search.findOneAndDelete({postId: event.postId})
        logger.info(`Searched post deleted ${event.postId}`)

    }catch(error){
        logger.error(`Something went wrong: ${error}`)
    }
}


module.exports = {handlePostCreated, handlePostDeleted}