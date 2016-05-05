try {
  require('source-map-support/register');
} catch (e) {}

import { v4 as uuid } from 'uuid';
import magicbus from '@leisurelink/magicbus';
import setupMagicbus, { broker } from './magicbus';

export function run() {
  let publisher;
  return Promise.resolve({})
  .then(setupMagicbus)
  .then(() => {
    publisher = magicbus.createPublisher(broker);
    return broker.bind('publish', 'receive', { pattern: '#' });
  })
  .then(() => {
    let index = 0;
    const publish = () => {
      let correlationId = uuid();
      let idx = index++;
      publisher.publish('event-lake.test.event', {
        correlationId: correlationId,
        data: {
          index: idx,
          some: `data for ${correlationId}`
        },
        references: [{
          source: 'test-index',
          id: idx
        }],
        when: new Date(),
        by: [{
          endpoint: {
            id: 'some-endpoint',
            token: 'some-token'
          },
          user: {
            id: 'some-endpoint',
            token: 'some-token'
          }
        }]
      });
    };

    setInterval(publish, 10);
  });
}
