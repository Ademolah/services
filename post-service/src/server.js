require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const Redis = require('ioredis')
const postRoute = require('./routes/posts-routes.js')
const errorHandler = require('./middleware/errorHandler.js')
const logger = require('./utils/logger.js')
const {RateLimiterRedis} = require('rate-limiter-flexible')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const {configuredCors} = require('./config/corsConfig.js')
const helmet = require('helmet')
const { connectRabbitMQ } = require('./utils/rabbitmq.js')

const app = express()
const port = process.env.PORT


//connect to database
mongoose.connect(process.env.MONGO_URI).then(()=>logger.info('Connected to database successfully'))
.catch((error)=>logger.error(`Error: ${error}`))

const redisClient = new Redis(process.env.REDIS_URL)


//middlewares
app.use(helmet())
app.use(cors())
app.use(express.json())


app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body ${req.body}`);
    next()
})

//DDoS protection and rate limiting 
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    point: 10,
    duration: 1
})

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip).then(()=>next()).catch(()=>{
        logger.warn(`Rate limit exceeded for ip ${req.ip}`);
        res.status(429).json({success: false, message: 'Too many request'})
    })
})


//ip based rate limiting for sensitive endpoints
const endpointsRateLimit = rateLimit({
    windowMs: 15*60*1000 ,//15 minutes
    max: 50,    //50 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res)=>{
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({success: false, message: 'Too many requests'});
    },
    store: new RedisStore({
        sendCommand: (...args)=> redisClient.call(...args)
    })
});


//apply to all post routes
app.use('/api/posts', endpointsRateLimit)


app.use('/api/posts', (req,res,next)=>{
    req.redisClient = redisClient
    next()
}, postRoute)

app.use(errorHandler)

async function startServer(){
    try {
        await connectRabbitMQ()
        app.listen(port, ()=>{
            logger.info(`Post Server now listening on port ${port}`)
        })
    } catch (error) {
        logger.error('Failed to connect to server ', error)
        process.exit(1)
    }
}


startServer()



process.on('unhandledRejection', (reason, promise)=>{
    logger.error(`Unhandled rejection at`, promise, 'reason :', reason)
})
