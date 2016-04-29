import mongojs from 'mongojs';
import Promise from 'bluebird';
import nameLogger from './logger';
import { mongo } from './env';

const logger = nameLogger('mongodb');

const COLLECTIONS = ['testCollection'];

Promise.promisifyAll([
  mongojs,
  require('mongojs/lib/collection'),
  require('mongojs/lib/database'),
  require('mongojs/lib/cursor')
]);

let db = mongojs(mongo.uri, COLLECTIONS, { auto_reconnect:true });//eslint-disable-line camelcase

//force connection to occur now.
let testCollection = db.testCollection;
let ObjectId = mongojs.ObjectId;

export { ObjectId, db, testCollection };

export default async context => {
  db.on('error', (err) => logger.error('Database error:', err));
  db.on('connect', () => logger.info('Connected to mongo at ' + mongo.uri));
  return context;
};
