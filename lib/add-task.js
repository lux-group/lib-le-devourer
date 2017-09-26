module.exports = exports = async ({ redis, backlogQueueName, task }) => {
  await redis.lpush(backlogQueueName, JSON.stringify(task))
}
