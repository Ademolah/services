const logger = require('./logger')
const amqp = require('amqplib')

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'facebook_events'

async function connectRabbitMQ(){
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL)
        channel = await connection.createChannel()

        await channel.assertExchange(EXCHANGE_NAME, 'topic', {durable: false})
        logger.info('Connected to rabbitMq')

        return channel
        
    } catch (error) {
        logger.error('Error connecting to rabbitmq: ', error)
    }
}


//broadcasting an event
async function publishEvent(routingKey, message){
    if(!channel){
        await connectRabbitMQ()
    }

    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)))
    logger.info(`Event published: ${routingKey}`)
}

async function consumeEvent(routingKey, callback){
    if(!channel){
        await connectRabbitMQ()
    }

    const q = await channel.assertQueue("", {exclusive: true})
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey)
    channel.consume(q.queue, (msg)=>{
        if(msg!==null){
            const content = JSON.parse(msg.content.toString())
            callback(content)
            channel.ack(msg)
        }
    })

    logger.info(`Subscribed to event: ${routingKey}`)
}


module.exports = {connectRabbitMQ, publishEvent, consumeEvent}