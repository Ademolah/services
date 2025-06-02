const cors = require('cors')


const configuredCors = ()=>{
    return cors({
        //origins -> this tells the endpoint which origins are allowed to access the api
        origin: (origin, callback) =>{
            const allowedOrigins = [
                "http://localhost:3000",
                "https://node-auth-fg8b.onrender.com:3000",
            ]

            if(!origin || allowedOrigins.indexOf(origin) !==-1){
                callback(null, true)
            } else {
                callback(new Error('This origin is not allowed by cors'))
            }
        },
        methods: ['GET','PUT','POST','DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Version'],
        exposedHeaders: ['Content-Range', 'X-Total-Count'],
        credentials: true, //this will enable support for cookies and others
        preflightContinue: false,
        maxAge: 600, //this will cache our prefligth for 10mins, and prevent sending options request multiple times
        optionsSuccessStatus: 204
    })
}

module.exports = {configuredCors}