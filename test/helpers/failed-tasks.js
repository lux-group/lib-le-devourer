let failedTasks = []

exports.get = () => failedTasks

exports.add = task => failedTasks.push(task)

exports.reset = () => { failedTasks = [] }
