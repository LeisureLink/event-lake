import magicbus from '@leisurelink/magicbus';
import nameLogger from './logger';
// import { Consumer } from '@leisurelink/magicbus-authentic';
// import AuthenticClient from '@leisurelink/authentic-client';
// import AuthContext from '@leisurelink/auth-context';
// import { subMiddleware } from '@leisurelink/magicbus-middleware-authentic';

import {
  rabbit as rabbitConfig,
  // auth as authConfig
} from './env';

// import fs from 'fs';
let broker = magicbus.createBroker('imp', 'event-lake', rabbitConfig);
let subscriber = magicbus.createSubscriber(broker);
let publisher = magicbus.createPublisher(broker);

// let AuthScope = AuthContext.AuthScope;
// let endpointKey = fs.readFileSync(authConfig.endpointKeyPath);
// let authenticKey = fs.readFileSync(authConfig.authenticKeyPath);
// let authenticClient = new AuthenticClient(authConfig.authenticUrl, authConfig.endpointKeyId, endpointKey);

// let authScopeConfig = {
//   issuer: authConfig.issuer,
//   audience: authConfig.audience,
//   issuerKey: authenticKey.toString(),
//   authority: authenticClient
// };

// let authScope = new AuthScope(authScopeConfig);

// subscriber.use(new Consumer(authenticClient, authScope).middleware);

// subscriber.use(subMiddleware(authenticClient));

nameLogger.consumeFrom(magicbus);

export { broker, publisher, subscriber };

export default context => {
  context.magicbus = { broker, subscriber, publisher };
  return context;
};
