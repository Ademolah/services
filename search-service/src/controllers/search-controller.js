const Search = require('../models/Search')
const logger = require('../utils/logger')


const searchPostController = async(req,res)=>{
    logger.info('Hitting search controller')
    try{
        const {query} = req.query


        //caching using redis
        // const cacheKey = `post:${query}`
        // const cachedSearch = await req.redisClient.get(cacheKey)

        // if(cachedSearch){
        //     return res.json(JSON.parse(cachedSearch))
        // }


        const result = await Search.find({$text: {$search: query}}, {score: {$meta: 'textScore'}})
        .sort({score: {$meta: 'textScore'}}).limit(10)

        res.status(200).json({
            success: true,
            result
        })

    }catch(error){
        logger.error(`Something went wrong: ${error}`)
        res.status(500).json({
            success: false,
            message: `Internal server error: ${error}`
        })
    }
}



module.exports = {searchPostController}