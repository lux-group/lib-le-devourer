const chai = require('chai')
const expect = chai.expect
const leDevourer = require('../index')
const { flushTestData } = require('./helpers/redis')
const processedTasks = require('./helpers/processed-tasks')
const failedTasks = require('./helpers/failed-tasks')
const wait = require('./helpers/wait')
const successTask = require('./tasks/success-task')
const failTask = require('./tasks/fail-task')
const failThenSucceedTask = require('./tasks/fail-then-succeed-task')

const taskTypes = {
  success_task: successTask,
  fail_task: failTask,
  fail_then_succeed_task: failThenSucceedTask
}

describe('Le Devourer', () => {
  let devourer = null
  before(() => {
    devourer = leDevourer.createDevourer({
      workerProcessingTimeout: 2,
      backlogQueueName: 'le-devourer-backlog',
      processingQueueName: 'le-devourer-processing'
    })
    devourer.devour(taskTypes)
  })

  beforeEach(async () => {
    await flushTestData()
    processedTasks.reset()
    failedTasks.reset()
  })

  it('should process task', async () => {
    const task = successTask.create({ id: '123' })
    await devourer.addTask(task)
    await wait(500)
    const doneTasks = processedTasks.get()
    expect(doneTasks).to.have.lengthOf(1)
    expect(doneTasks[0].type).to.eql('success_task')
    expect(doneTasks[0].data).to.eql({ id: '123' })
  })

  it('should process multiple tasks', async () => {
    await devourer.addTask(successTask.create({ id: '123' }))
    await devourer.addTask(successTask.create({ id: '456' }))
    await wait(500)
    const doneTasks = processedTasks.get()
    expect(doneTasks).to.have.lengthOf(2)
    expect(doneTasks[0].type).to.eql('success_task')
    expect(doneTasks[0].data).to.eql({ id: '123' })
    expect(doneTasks[1].type).to.eql('success_task')
    expect(doneTasks[1].data).to.eql({ id: '456' })
  })

  it('should process multiple tasks even when some fail', async () => {
    await devourer.addTask(successTask.create({ id: '123' }))
    await devourer.addTask(failTask.create({ id: 'fail:123' }))
    await devourer.addTask(failTask.create({ id: 'fail:456' }))
    await devourer.addTask(successTask.create({ id: '456' }))
    await wait(500)
    const failTasks = failedTasks.get()
    expect(failTasks).to.have.lengthOf(2)
    expect(failTasks[0].type).to.eql('fail_task')
    expect(failTasks[0].data).to.eql({ id: 'fail:123' })
    expect(failTasks[1].type).to.eql('fail_task')
    expect(failTasks[1].data).to.eql({ id: 'fail:456' })
    const doneTasks = processedTasks.get()
    expect(doneTasks).to.have.lengthOf(2)
    expect(doneTasks[0].type).to.eql('success_task')
    expect(doneTasks[0].data).to.eql({ id: '123' })
    expect(doneTasks[1].type).to.eql('success_task')
    expect(doneTasks[1].data).to.eql({ id: '456' })
  })

  it('should have failed tasks in processing queue', async () => {
    await devourer.addTask(successTask.create({ id: '123' }))
    await devourer.addTask(failTask.create({ id: 'fail:123' }))
    await devourer.addTask(failTask.create({ id: 'fail:456' }))
    await devourer.addTask(successTask.create({ id: '456' }))
    await wait(500)
    let metrics = await devourer.getMetrics()
    expect(metrics.backlogQueueSize).to.eql(0)
    expect(metrics.processingQueueSize).to.eql(2)
  })

  it('should put failed task back into backlog to retry', async () => {
    await devourer.addTask(failThenSucceedTask.create({ id: '999' }))
    await wait(500)
    let metrics = await devourer.getMetrics()
    expect(metrics.backlogQueueSize).to.eql(0)
    expect(metrics.processingQueueSize).to.eql(1)
    let doneTasks = processedTasks.get()
    expect(doneTasks).to.have.lengthOf(0)
    let failTasks = failedTasks.get()
    expect(failTasks).to.have.lengthOf(1)
    expect(failTasks[0].type).to.eql('fail_then_succeed_task')
    expect(failTasks[0].data).to.eql({ id: '999' })
    await wait(2000)
    metrics = await devourer.getMetrics()
    expect(metrics.backlogQueueSize).to.eql(0)
    expect(metrics.processingQueueSize).to.eql(0)
    doneTasks = processedTasks.get()
    expect(doneTasks).to.have.lengthOf(1)
    expect(doneTasks[0].type).to.eql('fail_then_succeed_task')
    expect(doneTasks[0].data).to.eql({ id: '999' })
  })
})
