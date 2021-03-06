import hapiSwaggered from 'hapi-swaggered';
import pkg from '../../package';
import _ from 'lodash';

export default {
  register: hapiSwaggered,
  options: {
    tagging: {
      pathLevel: 2
    },
    info: {
      title: _.startCase(pkg.name),
      description: pkg.description,
      version: pkg.version
    }
  }
};
