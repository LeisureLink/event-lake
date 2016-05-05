import { db, events } from './db';
import { google } from './env';
import _ from 'lodash';
import Promise from 'bluebird';
import machina from 'machina';
import nameLogger from './logger';

const logger = nameLogger('write-stream');

const DeferredPromise = function() {
  let result = { };
  result.promise = new Promise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });
  return result;
};

export default function CreateEventBatch() {
  const EventBatch = machina.Fsm.extend({
    name: 'write-stream-machine',
    outstandingWrites: [],
    attempts: 0,
    backoff: 1000,

    insertBatch: function() {
      this.transition('inserting');
      if (this.batchTimeout){
        clearTimeout(this.batchTimeout);
      }
    },

    write: function(event) {
      let deferred = DeferredPromise();
      this.handle('write', event, deferred);
      return deferred.promise;
    },
    initialState: 'closed',
    states: {
      'closed': {
        _onEnter: function() {
          this.attempts = 0;
          this.backoff = 1000;
        },
        write: function() {
          this.deferUntilTransition('open');
          this.transition('open');
        }
      },
      'open': {
        _onEnter: function() {
          this.outstandingWrites = [];

          this.batchTimeout = setTimeout(() => {
            logger.debug('Write batch timed out, inserting');
            this.insertBatch();
          }, this.batchTimeoutMs || 30 * 1000);
        },
        write: function(event, deferred) {
          let write = { event, deferred };
          this.outstandingWrites.push(write);
          if (this.outstandingWrites.length >= (google.streamBatchSize || 500)) {
            logger.debug('Write batch at capacity, inserting');
            this.insertBatch();
          }
        }
      },
      'inserting': {
        _onEnter: function() {
          this.attempts++;
          logger.debug(`Writing batch, attempt #${this.attempts}`);
          let rows = _.map(this.outstandingWrites, write => {
            return {
              json: write.event,
              insertId: write.event.correlationId
            };
          });
          events.insertAsync(rows, { raw: true }, (err, insertErrors, response) => {
            if (err) {
              logger.error('Error inserting batch:', err);
              this.transition('error');
              return;
            }
            logger.debug('Batch Write Response:', response);
            if (insertErrors && insertErrors.length) {
              logger.warn('Ignored errors during insert:', insertErrors);
            }
            _.each(this.outstandingWrites, write => {
              write.deferred.resolve();
            });
            this.outstandingWrites = [];
            this.transition('closed');
          });
        },
        write: function() {
          this.deferUntilTransition('closed');
        }
      },
      'error': {
        _onEnter: function () {
          if (this.attempts > (google.maxRetryAttempts || 10)) {
            _.each(this.outstandingWrites, write => {
              write.deferred.reject(new Error('Batch write failure'));
            });
            this.transition('closed');
          } else {
            setTimeout(()=>{
              this.transition('inserting');
            }, this.backoff);
            this.backoff *= 2;
            let maxWait = (google.maxRetryWaitMs || 900*1000);
            if (this.backoff > maxWait) {
              this.backoff = maxWait;
            }
          }
        },
        write: function() {
          this.deferUntilTransition('closed');
        }
      }
    }
  });

  return new EventBatch();
}
