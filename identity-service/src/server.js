require('dotenv').config()
const mongoose = require('mongoose')
const logger = require('./utils/logger.js')
const express = require('express')
const helmet = require('helmet')
const {configuredCors} = require('./config/corsConfig.js')
const errorHandler = require('./middlewares/errorHandler.js')
const {RateLimiterRedis} = require('rate-limiter-flexible')
const Redis = require('ioredis')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const routes = require('./routes/identity-service.js')
const cors = require('cors') 



//connect to database
// try {
//     mongoose.connect(process.env.MONGO_URI)
//     logger.info('Connected to database successfully')
// } catch (error) {
//     logger.error(`Something went wrong: ${error}`)
// }

mongoose.connect(process.env.MONGO_URI).then(()=> logger.info('connected to database successfully')).catch((error)=>logger.error(`Something went wrong: ${error}`))


//creating the redis client  
const redisClient = new Redis(process.env.REDIS_URL) 




const app = express()


//middleware
app.use(helmet())
app.use(configuredCors())
// app.use(cors())
app.use(express.json())


app.use((req,res, next) => {
    logger.info(`Received ${req.method} request to ${req.url} `);
    logger.info(`Request body, ${req.body}`); 
    next()
})

//DDoS protection and rate limiting 
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    point: 10,
    duration: 1
})


app.use((req, res,next)=>{
    rateLimiter.consume(req.ip).then(()=> next()).catch(()=> {
        logger.warn(`Rate limit exceeded for ${req.ip}`);
        res.status(429).json({success: false, message: 'Too many requests'});
    })
})


//IP based rate limiter for sensitive endpoints
const endpointsRateLimit = rateLimit({
    windowMs: 15*60*1000,    //15minutes
    max: 100,     //100 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res)=>{
        logger.warn(`Sensitive endpoint rate limit exceeded for iP: ${req.ip}`);
        res.status(429).json({success: false, message: 'Too many requests'});
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
});


//apply to our endpoint route (here it is only applied to signup route)
app.use('/api/auth/signup', endpointsRateLimit)


app.use('/api/auth', routes)


//error handler
app.use(errorHandler)

const port = process.env.PORT || 3001
app.listen(port, ()=>{
    logger.info(`App now listening on port ${port}`)
})


//unhandled promise rejection
process.on('unhandledRejection', (reason, promise)=>{
    logger.error(`Unhandled rejection at`, promise, 'reason :', reason)
})

