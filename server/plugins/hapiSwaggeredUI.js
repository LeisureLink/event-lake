import ui from '@leisurelink/hapi-swaggered-ui';
import pkg from '../../package';
import _ from 'lodash';

export default {
  register: ui,
  options: {
    title: _.startCase(pkg.name),
    path: '/docs',
    authorization: {
      field: 'apiKey',
      scope: 'query',
      placeholder: 'Enter your apiKey here...'
    },
    swaggerOptions: {
      docExpansion: 'list'
    }
  }
};
