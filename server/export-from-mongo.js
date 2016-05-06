try {
  require('source-map-support/register');
} catch (e) {}

import magicbus from '@leisurelink/magicbus';
import setupMagicbus, { broker } from './magicbus';
import nameLogger from './logger';
import Promise from 'bluebird';
import mongojs from 'mongojs';

let logger = nameLogger('export');

Promise.promisifyAll([
  mongojs,
  require('mongojs/lib/collection'),
  require('mongojs/lib/cursor')
]);

let connection = mongojs(process.env.EVENT_LAKE_MONGO_EXPORT_URI);
let events = connection.collection('events');

let publisher;
Promise.resolve({})
  .then(setupMagicbus)
  .then(() => {
    if (process.env.DO_EXPORT){
      publisher = magicbus.createPublisher(broker);
      return broker.bind('publish', 'receive', { pattern: '#' });
    }
    return Promise.resolve();
  })
  .then(async () => {
    let count = await events.countAsync({});
    logger.info(`Found ${count} events to export`);
    if (process.env.DO_EXPORT){
      events.find({}).forEach(function(err, event) {
        if (err) {
          logger.error('Error during forEach', err);
        }
        if (!event) {
          logger.info('All events exported.');
          process.exit(0);
        }
        event.event.correlationId = event['_id'];
        publisher.publish(event.key, event.event);
      });
      // for (let event of allEvents) {
      //   event.event.correlationId = event['_id'];
      //   publisher.publish(event.key, event.event);
      // }
    } else {
      let sample = await events.find({}).limit(1).toArrayAsync();
      logger.info(`Sample first event:\n${JSON.stringify(sample[0],null,2)}`);
      process.exit(0);
    }
  });
