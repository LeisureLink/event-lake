try {
  require('source-map-support/register');
} catch (e) {}

import { Server } from 'hapi';
import pkg from '../package';
import env from './env';
import registerPlugins from './plugins';
import setupDb from './db';
import setupMagicbus from './magicbus';
import setupListeners from './listeners';

const hapiServer = new Server({
  connections: {
    router: {
      stripTrailingSlash: true
    },
    routes: {
      validate: {
        options:{
          abortEarly: false
        }
      }
    }
  }
});

hapiServer.connection({
  labels: ['imp', 'event-lake'],
  port: env.self.port
});

/*
  Unidirectional flow of data
  Each function passed into the chain should return a context
  context = { server, ...}
*/
export default registerPlugins(hapiServer)
  .then(setupDb)
  .then(setupMagicbus)
  .then(setupListeners)
  .then(context => {
    const { server } = context;
    server.log('info', `Starting ${pkg.name} at ${server.info.uri}`);
    return server.start().then(() => server);
  })
  .catch(err => hapiServer.log('error', err.stack));
