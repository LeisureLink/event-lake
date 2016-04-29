import 'source-map-support/register';
import Magicbus from '@leisurelink/magicbus';
import { rabbit } from '../server/env';
import sinon from 'sinon';
import { expect } from 'chai';

before(() =>{
  global.setupMagicbus = (domain, app) => {
    let broker = Magicbus.createBroker(domain, app, rabbit);
    let publisher = Magicbus.createPublisher(broker);
    let subscriber = Magicbus.createSubscriber(broker);
    let binder = Magicbus.createBinder(rabbit);
    return { broker, subscriber, publisher, binder };
  };
  global.Magicbus = Magicbus;

  global.sinon = sinon;
  global.expect = expect;

  global.sandbox = sinon.sandbox.create();
});

after(() =>{

});

beforeEach(() =>{

});

afterEach(() =>{
  sandbox.restore();
});
