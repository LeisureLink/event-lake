import moment from 'moment';
import { db } from '../db';
import Boom from 'boom';
import stream from 'stream';

// import nameLogger from '../logger';
// const logger = nameLogger('events-route');

const buildSQL = (since, maxResults) => {
  let limit = parseInt(maxResults, 10) || 1000;
  return `
SELECT
  correlationId,
  when,
  event.payload,
  GROUP_CONCAT(types, '|') AS types,
  GROUP_CONCAT(event.references.source, '|') AS referenceSources,
  GROUP_CONCAT(event.references.id, '|') AS referenceIds,
  GROUP_CONCAT(by.endpoint.id, '|') AS endpointIds,
  GROUP_CONCAT(by.user.id, '|') AS userIds,
FROM EventLake.Events
WHERE when >= '${since.toISOString()}'
GROUP BY correlationId, when, event.payload
ORDER BY when
LIMIT ${limit}
`;
};

const buildReferences = (result) => {
  if (!result.referenceSources || !result.referenceIds) {
    return [];
  }
  let referenceSources = result.referenceSources.split('|');
  let referenceIds = result.referenceIds.split('|');
  let references = [];
  for (let i = 0; i < referenceIds.length; i++) {
    references.push({ source: referenceSources[i], id: referenceIds[i] });
  }
  return references;
};

const buildBy = (result) => { // eslint-disable-line
  if (!result.endpointIds || !result.userIds) {
    return [];
  }
  let endpointIds = result.endpointIds.split('|');
  let userIds = result.userIds.split('|');
  let references = [];
  for (let i = 0; i < userIds.length; i++) {
    references.push({
      endpoint: endpointIds[i] ? { id: endpointIds[i] } : null,
      user: userIds[i] ? { id: userIds[i] } : null
    });
  }
  return references;
};

const buildResult = (result) => {
  return {
    correlationId: result.correlationId,
    when: result.when,
    types: result.types.split('|'),
    event: {
      references: buildReferences(result),
      payload: result.event_payload
    },
    by: buildBy(result)
  };
};

class BigQueryToResponse extends stream.Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(data, enc, next) {
    this.push(buildResult(data));
    next();
  }
}

class ObjectToString extends stream.Transform {
  constructor() {
    super({ readableObjectMode: false, writableObjectMode: true });
    this.first = true;
  }

  _transform(chunk, enc, next) {
    this.push(this.first ? '[' : ',');
    this.first = false;
    this.push(JSON.stringify(chunk, enc));
    next();
  }

  _flush(next){
    this.push(this.first ? '[]' : ']');
    next();
  }
}

const plugin = {
  register:  (server, options, next) => {
    server.route({
      method: 'GET',
      path: '/v1/{lang}/events',
      config: {
        tags: ['api'],
        description: 'Queries events',
        auth: 'api-key',
        plugins: {
          'hapi-swaggered': {
            parameters:[
              {
                name:'since',
                in:'query',
                description:'The date to query events since',
                required:false,
                type:'string'
              },
            ]
          }
        }
      },
      handler: async function (request, reply) {
        let since;
        try {
          since = moment(request.query.since || moment.invalid());
        } catch (err) {
          since = moment.invalid();
        }
        if (!since.isValid()) {
          reply(Boom.badRequest('Please specify a "since" query string parameter that is a valid date.'));
          return;
        }
        let dataStream = db.query(buildSQL(since, request.query.maxResults));
        dataStream.on('error', (err) => {
          reply(Boom.wrap(err));
        });
        reply(dataStream
          .pipe(new BigQueryToResponse())
          .pipe(new ObjectToString()))
        .type('application/json');
      }
    });
    return next();
  }
};

plugin.register.attributes = {
  name: 'events'
};

export default plugin;
