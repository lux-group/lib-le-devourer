const Redis = require('ioredis')

exports.init = ({ redisUrl }) => {
  if (redisUrl) {
    return new Redis(redisUrl)
  } else {
    return new Redis()
  }
}
