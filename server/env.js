import _ from 'lodash';
import path from 'path';
import chalk from 'chalk';
import { name, keys } from './config';
import fs from 'fs';

function createKey(key){
  return `${name}_${key}`.toUpperCase();
}

function get(key){
  return process.env[createKey(key)];
}

function isEnv(e){
  return process.env.NODE_ENV === e;
}

function setOrDefault(name, val){
  let key = createKey(name);
  process.env[key] = process.env[key] || val;
}

function replace(name, val){
  let key = createKey(name);
  process.env[key] = val;
}

let port = 10099;
setOrDefault('port', process.env.PORT || port);

// Authentic
setOrDefault('trusted_endpoint_key_id', `event-lake/${process.env.PROJECT_ID || 'self'}`);
setOrDefault('trusted_endpoint_keyfile', path.join(path.dirname(__dirname), 'event-lake-key.pem'));
setOrDefault('trusted_endpoint_keypub', path.join(path.dirname(__dirname), './event-lake-key.pub'));
setOrDefault('jwt_issuer', 'test');
setOrDefault('jwt_audience', 'test');

if (!isEnv('production') && !isEnv('stage')) {
  _.each(keys, key => {
    if(key){
      let service = key.replace('#', name.toUpperCase());
      let variable = service.replace(/\//g, '_').toUpperCase();
      console.log(`Required: ${chalk.yellow(variable)}`);
    }
  });

  setOrDefault('authentic_url', 'http://localhost:10010/'); // Requires a slash at the end!!!!
  setOrDefault('jwt_issuer_pub', path.resolve(__dirname, '../../authentic-api/test/test-key.pub'));

  //rabbitMQ
  setOrDefault('rabbitmq_host', 'localhost');
  setOrDefault('rabbitmq_port', 5672);
  setOrDefault('rabbitmq_username', 'guest');
  setOrDefault('rabbitmq_password', 'guest');

  if (isEnv('local') || isEnv('test')) {
    let instanceNumber = parseInt(process.env.NODE_APP_INSTANCE || 0, 10);
    replace('port', port + instanceNumber);
    replace('rabbitmq_host', 'docker.dev');
    replace('rabbitmq_port', 5672);
    replace('mongo_uri', 'docker.dev/eventLake');
  }

  if (isEnv('test')) {
    replace('rabbitmq_host', 'localhost');
  }
}

let config = {
  self: {
    env: process.env.NODE_ENV,
    port: get('port')
  },
  auth: {
    endpointKeyId: get('trusted_endpoint_key_id'),
    endpointKeyPath: get('trusted_endpoint_keyfile'),
    endpointPrivateKey: fs.readFileSync(get('trusted_endpoint_keyfile')),
    endpointPublicKey: fs.readFileSync(get('trusted_endpoint_keypub')),
    issuer: get('jwt_issuer'),
    audience: get('jwt_audience'),
    authenticKeyPath: get('jwt_issuer_pub'),
    authenticUrl: get('authentic_url')
  },
  rabbit: {
    server: get('rabbitmq_host'),
    port: get('rabbitmq_port'),
    user: get('rabbitmq_username'),
    pass: get('rabbitmq_password')
  },
  logs:{
    host: process.env.LOGSTASH_HOST
  },
  google:{
    projectId: get('google_project_id'),
    keyPath: get('google_keyfile')
  }
};
if(process.env.DEBUG || isEnv('local')){
  console.log(config);
}

export default config;
