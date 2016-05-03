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

export default function CreateWriteStreamMachine() {
  const WriteStreamMachine = machina.Fsm.extend({
    name: 'write-stream-machine',
    stream: null,
    writeCount: 0,
    outstandingWrites: [],
    backoff: 1000,

    doWrite: function(write) { // should only be called in open state
      this.stream.write(this.writeCount === 0 ? '' : '\n', 'utf8');
      if (google.maxRetries && write.attempts > google.maxRetries) {
        write.deferred.reject();
      }
      write.attempts++;
      this.writeCount++;
      logger.debug(write.event);
      this.stream.write(write.event, 'utf8', () => {
        logger.info('Write success');
        this.outstandingWrites = _.pull(this.outstandingWrites, write);
        write.deferred.resolve();
      });
    },

    doEnd: function() {
      this.stream.end('', 'utf8');
      if (this.batchTimeout){
        clearTimeout(this.batchTimeout);
      }
    },

    write: function(event) {
      let deferred = DeferredPromise();
      this.handle('write', JSON.stringify(_.defaultsDeep({ insertId: event.correlationId }, event)), deferred);
      return deferred.promise;
    },
    initialState: 'closed',
    states: {
      'closed': {
        _onEnter: function() {
          this.stream = null;
          this.writeCount = 0;
          this.outstandingWrites = [];
          this.backoff = 1000;
        },
        write: function() {
          this.deferUntilTransition('open');
          this.transition('open');
        }
      },
      'open': {
        _onEnter: function() {
          logger.info('Opening BigQuery write stream');
          try {
            this.stream = events.createWriteStream('json');
          } catch (err) {
            logger.error('Error creating event write stream', err);
            this.transition('error');
          }
          this.stream.on('error', err => {
            logger.error('Error in event write stream', err);
            this.transition('error');
          });
          this.stream.on('complete', (job) => {
            logger.info(`BigQuery Streaming Insert Job ${job.id} completed`);
            setTimeout(()=> db.job(job.id).getAsync().then((details)=>logger.info(details.metadata.status)), 30*1000);
          });
          this.stream.on('finish', () => {
            logger.info('finished');
          });
          this.writeCount = 0;

          if (this.outstandingWrites.length) {
            for (let outstandingWrite in outstandingWrite) {
              this.doWrite(outstandingWrite);
            }
          }
          this.outstandingWrites = [];

          this.batchTimeout = setTimeout(() => {
            logger.info('Write batch timed out, closing stream');
            this.doEnd();
          }, this.batchTimeoutMs || 30 * 1000);
        },
        write: function(event, deferred) {
          let write = { event, deferred, attempts: 0 };
          this.outstandingWrites.push(write);
          this.doWrite(write);
          if (this.writeCount > (google.streamBatchSize || 500)) {
            logger.info('Finished write batch, closing stream');
            this.doEnd();
          }
        }
      },
      'error': {
        _onEnter: function () {
          setTimeout(()=>{
            this.transition('open');
          }, this.backoff);
          if (this.backoff < (google.maxRetryWaitMs || 900*1000)) {
            this.backoff *= 2;
          }
        },
        write: function() {
          this.deferUntilTransition('open');
        }
      }
    }
  });

  return new WriteStreamMachine();
}
