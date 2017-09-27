const uuidV4 = require('uuid/v4')

module.exports = exports = ({ type, data }) => {
  return {
    type,
    data,
    task_uuid: uuidV4()
  }
}
