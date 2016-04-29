import _ from 'lodash';
import { loadAsync } from 'mod.js';
import { green, cyan, red } from 'chalk';

const standardPlugins = ['inert', 'vision'];

export default server => {
  return loadAsync(__dirname)
    .then(filePlugins => {
      let plugins = _.union(standardPlugins.map(require), _.values(filePlugins));
      return server.register(plugins, { routes: { prefix: '/event-lake' } });
    })
    .catch(err => {
      console.error(red(err.stack));
    })
    .then(() => {
      const plugins = _.keys(server.registrations).join(', ');
      server.log('info', green('Plugins successfully loaded: ') + cyan(plugins));
      return { server };
    });
};
