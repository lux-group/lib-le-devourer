const devour = require('./devour')

// This works like rubys x.times do |i| (see https://stackoverflow.com/questions/30452263/is-there-a-mechanism-to-loop-x-times-in-es6-ecmascript-6-without-mutable-varia)
const times = x => f => {
  if (x > 0) {
    f()
    times(x - 1)(f)
  }
}

module.exports = exports = ({
  redis,
  workerConcurrency,
  workerProcessingTimeout,
  backlogQueueName,
  processingQueueName,
  taskTypes
}) => {
  const { startWorkLoop } = devour({
    redis,
    workerProcessingTimeout,
    backlogQueueName,
    processingQueueName
  })

  times(workerConcurrency)(() => startWorkLoop(taskTypes))
}
