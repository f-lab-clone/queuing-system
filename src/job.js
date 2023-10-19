const config = require('./config')
const logger = $require('loaders/logger')

const redis = $require('loaders/redis')
const TicketStoreService = $require('services/ticketStore')
const JobSercice = $require('services/jobService')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function start() {
  await $require('loaders')()

  const ticketStoreService = new TicketStoreService(redis)
  const jobSerivce = new JobSercice(ticketStoreService, config.job)

  logger.info(`
    ----------------------------------------------
    🛡️  JOB Started                              🛡️
        NODE_ENV: ${config.NODE_ENV}
    ----------------------------------------------
  `)

  while (1) {
    try {
      logger.info(`Job Running`)
      await jobSerivce.removeExpiredEvent()
      const events = await jobSerivce.getEventList()
      for (const { eventId } of events) {
        await jobSerivce.removeExpiredTicket(eventId)
        await jobSerivce.moveEventInToRunning(eventId)
      }
    } catch (err) {
      logger.error(`Job Error Occured`)
      console.error(err)
    } finally {
      await sleep(config.job.intevalPerSec * 1000)
    }
  }
}

start()
