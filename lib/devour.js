// This is an event devourer.
// It's used to work through a queue of tasks on the backlog list
//
// Once an event is pulled in for processing, it's moved to the processing list, and a lock is set.
// If the lock times out, then we assume that the worker has failed to process the event,
// and then we move it back to the backlog.
//
// This guarantees each event will be processed at least once.
// Note: event processors should be idempotent, because it's possible for an event to finish processing, but then die before
// releasing the lock.

const CONTEXT_SWITCH_TIMEOUT = 1

const LOCKED = 'locked'
const util = require('util')

const failuresKey = task => `failures:${task}`
const locksKey = task => `locks:${task}`

module.exports = exports = ({ redis, workerProcessingTimeout, backlogQueueName, processingQueueName }) => {
  const workOnTasks = async (taskTypes) => {
    while (true) {
      const task = await redis.brpoplpush(
        backlogQueueName,
        processingQueueName,
        CONTEXT_SWITCH_TIMEOUT
      )
      if (!task) {
        break
      }
      await redis.set(locksKey(task), LOCKED, 'EX', workerProcessingTimeout)
      const parsedTask = JSON.parse(task)

      if (taskTypes[parsedTask.type]) {
        await taskTypes[parsedTask.type].process(parsedTask)
      } else {
        console.log(`No task worker found for: ${parsedTask.type}`)
      }

      await redis.lrem(processingQueueName, -1, task)
      await redis.del(failuresKey(task))
    }
  }

  const reapDeadTasks = async () => {
    const size = await redis.llen(processingQueueName)
    let count = 0

    while (true) {
      const task = await redis.rpoplpush(processingQueueName, processingQueueName)
      count = count + 1
      if (!task || count > size) {
        break
      }
      const lock = await redis.get(locksKey(task))
      if (lock !== LOCKED) {
        // This task has timed out - move it back to the backlog
        const failureCount = await redis.incr(failuresKey(task))
        console.log(`Task timed out: ${task}| Total failures for this task: ${failureCount}`)
        await redis.lpush(backlogQueueName, task)
        await redis.lrem(processingQueueName, -1, task)
      }
    }
  }

  return {
    startWorkLoop: async (taskTypes) => {
      console.log(`Worker started devouring from ${backlogQueueName} queue`)
      try {
        while (true) {
          try {
            await workOnTasks(taskTypes)
          } catch (e) {
            console.log('EXPLODED:', util.inspect(e, false, null))
          }
          await reapDeadTasks()
        }
        // should never get here
      } catch (e) {
        console.log(e)
        process.exit(1)
      }
    }
  }
}
