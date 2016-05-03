import gcloud from 'gcloud';
import Promise from 'bluebird';
import nameLogger from './logger';
import { google } from './env';
import schema from './schemas/bigquery-events';

Promise.promisifyAll(require('gcloud/lib/bigquery').prototype);
Promise.promisifyAll(require('gcloud/lib/bigquery/dataset').prototype);
Promise.promisifyAll(require('gcloud/lib/bigquery/table').prototype);
Promise.promisifyAll(require('gcloud/lib/bigquery/job').prototype);

const logger = nameLogger('bigquery');

const db = gcloud.bigquery({
  projectId: google.projectId,
  keyFilename: google.keyPath
});

const dataset = db.dataset('EventLake');
const events = dataset.table('Events');

export { db, dataset, events };

export default async context => {
  logger.info('Initializing BigQuery table');
  let datasetExists = await dataset.existsAsync();
  if (!datasetExists) {
    logger.info('BigQuery EventLake dataset does not exist, creating.');
    await dataset.createAsync();
  }

  let tableExists = await events.existsAsync();
  if (!tableExists) {
    logger.info('BigQuery EventLake.Events table does not exist, creating with supplied schema');
    await events.createAsync({ schema: schema });
  }
  return context;
};
