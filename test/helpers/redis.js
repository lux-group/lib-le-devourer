const libRedis = require('../../lib/redis')
const redis = libRedis.init({})

exports.flushTestData = async () => {
  const keys = await redis.keys('le-devourer*')
  if (keys.length) {
    await redis.del(keys)
  }
}
