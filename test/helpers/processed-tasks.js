let processedTasks = []

exports.get = () => processedTasks

exports.add = task => processedTasks.push(task)

exports.reset = () => { processedTasks = [] }
