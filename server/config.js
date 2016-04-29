module.exports = {
  name: 'event_lake',
  keys: [
    '#/port',
    '#/authentic/url',
    '#/trusted_endpoint/key_id',
    '#/trusted_endpoint/keyfile',
    '#/jwt/issuerpub',
    '#/jwt/issuer',
    '#/jwt/audience',

    '#/rabbitmq/host',
    '#/rabbitmq/port',
    '#/rabbitmq/username',
    '#/rabbitmq/password',
    '#/mongo/uri'
  ],
  optional: [ ]
};
