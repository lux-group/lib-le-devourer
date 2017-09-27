const addTask = require('./lib/add-task')
const createTask = require('./lib/create-task')
const devourer = require('./lib/devourer')
const getMetrics = require('./lib/get-metrics')
const libRedis = require('./lib/redis')

const defaultOptions = {
  workerConcurrency: 1,
  workerProcessingTimeout: 60,
  backlogQueueName: 'backlog',
  processingQueueName: 'processing',
  redisUrl: null
}

const removeUndefined = (obj) => {
  return Object.keys(obj)
    .filter((key) => obj[key] !== undefined)
    .reduce((result, key) => {
      result[key] = obj[key]
      return result
    }, {})
}

exports.createDevourer = (opts = {}) => {
  const options = Object.assign({}, defaultOptions, removeUndefined(opts))
  const { workerConcurrency, workerProcessingTimeout, backlogQueueName, processingQueueName, redisUrl } = options

  const redis = libRedis.init({ redisUrl })

  return {
    addTask: async (task) => {
      await addTask({ redis, backlogQueueName, task })
    },
    devour: (taskTypes) => {
      devourer({
        redis,
        workerConcurrency,
        workerProcessingTimeout,
        backlogQueueName,
        processingQueueName,
        taskTypes
      })
    },
    getMetrics: async () => {
      const metrics = await getMetrics({ redis, backlogQueueName, processingQueueName })
      return metrics
    }
  }
}

exports.createTask = createTask
