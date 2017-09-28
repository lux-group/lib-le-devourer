const leDevourer = require('../../index')
const processedTasks = require('../helpers/processed-tasks')
const failedTasks = require('../helpers/failed-tasks')

exports.create = (data) => {
  return leDevourer.createTask({
    type: 'fail_then_succeed_task',
    data: data
  })
}

exports.process = async (task) => {
  const failed = failedTasks.get()
  const hasFailedBefore = !!failed.find((t) => { return t.task_uuid === task.task_uuid })

  if (hasFailedBefore) {
    processedTasks.add(task)
  } else {
    const err = new Error('Failed to process task')
    err.task = task
    failedTasks.add(task)
    throw err
  }
}
