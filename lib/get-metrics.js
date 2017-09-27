module.exports = exports = async ({ redis, backlogQueueName, processingQueueName }) => {
  return {
    backlogQueueSize: await redis.llen(backlogQueueName),
    processingQueueSize: await redis.llen(processingQueueName)
  }
}
