import EnvConfigurator from '@leisurelink/env-configurator';

import '../env';
import spec from '../config';
import { red } from 'chalk';

let plugin = {
  register: (server, options, next) => {
    let configurator = new EnvConfigurator();

    configurator.fulfill(spec, errs => {
      if(errs){
        errs.forEach(err => {
          console.log(red(err.message));
          server.log('error', red(err.stack));
        });
        // process.exit(1);
      }

      server.expose({
        get: (name) => configurator.get(spec.name, name)
      });

      next();
    });
  }
};

plugin.register.attributes = {
  name: 'config'
};

export default plugin;
