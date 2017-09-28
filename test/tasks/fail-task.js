const leDevourer = require('../../index')
const failedTasks = require('../helpers/failed-tasks')

exports.create = (data) => {
  return leDevourer.createTask({
    type: 'fail_task',
    data: data
  })
}

exports.process = async (task) => {
  failedTasks.add(task)
  const err = new Error('Failed to process task')
  err.task = task
  throw err
}
