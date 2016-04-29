import pkg from '../../package';
import { auth } from '../env';

export default {
  method: 'GET',
  path: '/healthcheck',
  config: {
    description: 'Status check to see if the api services are up',
    tags: ['healthcheck']
  },
  handler: (req, rep) => {
    return rep({
      name: pkg.name,
      env: process.env.NODE_ENV,
      apiVersion: pkg.version,
      status: 'ok',
      dependencies: pkg.dependencies,
      key: auth.endpointPublicKey.toString()
    });
  }
};
