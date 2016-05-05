import moment from 'moment';
import { db } from '../db';
import nameLogger from '../logger';
import Boom from 'boom';
import _ from 'lodash';

const logger = nameLogger('events-route');

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

const buildBy = (result) => {
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

const buildResponse = (results) => {
  return _.map(results, (result) => {

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
  });
};

const plugin = {
  register:  (server, options, next) => {
    server.route({
      method: 'GET',
      path: '/events',
      config: {
        tags: ['api', 'trusted'],
        description: 'Queries events',
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
        logger.info(`Querying for next 1000 rows since ${since}`);
        db.query(buildSQL(since, request.query.maxResults),
          function (err, results) {
            if (err) {
              reply(Boom.wrap(err));
              return;
            }
            reply(buildResponse(results));
          });
      }
    });
    return next();
  }
};

plugin.register.attributes = {
  name: 'events'
};

export default plugin;
