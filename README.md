# le-devourer

> Queue based event processor, backed by redis

[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

## Usage

This module uses async/await so you will need to be running a version of node that supports async/await to use this package

```js
const leDevourer = require('le-devourer')
const devourer = leDevourer.createDevourer({
  workerConcurrency: 1, // Defaults to 1
  workerProcessingTimeout: 60, //Defaults to 60
  backlogQueueName: 'backlog', // Defaults to backlog
  processingQueueName: 'processing', //Defaults to processing
  redisUrl: process.env.REDIS_URL //Defaults to localhost:6379
})
```

### Creating and adding a task

```js
const myEmailTask = leDevourer.createTask({
  type: 'my_email_task',
  data: { id: 12345, email: 'hi@example.com' }
})

devourer.addTask(myEmailTask)
```

### Creating task processors

```js
const myEmailTaskProcessor = {
  process: async (task) => {
    console.log(task.type) // prints my_email_task
    console.log(task.data.id) // prints 12345
    const success = doSomething(event.data.email)
    if (success) {
      console.log('yay')
    } else {
      devourer.addTask(task)
    }
  }
}
```

### Start event devourer

```js
const taskTypes = {
  my_email_task: myEmailTaskProcessor
}

devourer.devour(taskTypes)
```

### Get metrics

```js

const { backlogQueueSize, processingQueueSize } = await devourer.getMetrics()

```

