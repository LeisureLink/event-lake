import { v4 as uuid } from 'uuid';
import _ from 'lodash';

const hasMessageTypeStartingWith = (messageTypes, starting) => {
  for (let messageType of messageTypes) {
    if (messageType.indexOf(starting) === 0) {
      return true;
    }
  }
  return false;
};

const getReferences = (payload, messageTypes) => {
  if (payload.references) {
    return _.map(payload.references, reference => {
      return {
        source: `${reference.source}`,
        id: `${reference.id}`
      };
    });
  }
  if (payload.bookingId && hasMessageTypeStartingWith(messageTypes, 'accounting-service.')) {
    return [{ source: 'imp.booking', id: `${payload.bookingId}` }];
  }
  if (payload.id) {
    return [{ source: 'adaptors.bdc.booking', id: `${payload.id}` }];
  }
  return [];
};

const getBy = (payload) => { //eslint-disable-line
  let by = [];
  if (_.isArray(payload.by)) {
    for (let item of payload.by) {
      if (item.endpoint && item.endpoint.id) {
        by.push({ endpoint: { id: item.endpoint.id, token: item.endpoint.token } });
      }
      if (item.user && item.user.id) {
        by.push({ user: { id: item.user.id, token: item.user.token } });
      }
    }
  } else if (payload.by) {
    if (payload.by.user && payload.by.user.id) {
      by.push({ user: { id: payload.by.user.id, token: payload.by.user.token } });
    }
    if (_.isArray(payload.by.endpoints)) {
      for (let item of payload.by.endpoints) {
        if (item.id) {
          by.push({ endpoint: { id: item.id, token: item.token } });
        }
      }
    }
  }
  return by;
};

const toFieldArray = (obj) => { //eslint-disable-line
  let result = [];
  for (let key in obj) {
    if (typeof(obj[key]) === 'undefined' || obj[key] === null)
      continue;
    if (typeof(obj[key]) === 'object') {
      for (let subproperty of toFieldArray(obj[key])) {
        result.push({ name: `${key}.${subproperty.name}`, value: `${subproperty.value}` });
      }
    } else {
      result.push({ name: `${key}`, value: `${obj[key]}` });
    }
  }
  return result;
};

export default (payload, messageTypes, raw) => {
  return {
    correlationId: raw.properties.headers.correlationId || uuid(),
    event: {
      references: getReferences(payload, messageTypes),
      payload: JSON.stringify(payload),
      properties: toFieldArray(raw.properties),
      headers: toFieldArray(raw.properties.headers),
    },
    when: payload.when || raw.properties.headers.Date || new Date(),
    types: messageTypes,
    by: getBy(payload)
  };
};
