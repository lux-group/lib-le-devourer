const Redis = require('ioredis')

exports.init = ({ redisUrl, redisTls }) => {
  if (redisUrl && redisTls) {
    return new Redis(redisUrl, {
            tls: {
                rejectUnauthorized: false
            }
        })
  } else if (redisUrl) {
    return new Redis(redisUrl)
  } else {
    return new Redis()
  }
}
