const leDevourer = require('../../index')
const processedTasks = require('../helpers/processed-tasks')

exports.create = (data) => {
  return leDevourer.createTask({
    type: 'success_task',
    data: data
  })
}

exports.process = async (task) => {
  processedTasks.add(task)
}
