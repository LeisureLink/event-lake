import transformEvent from './transform-event';
import CreateWriteStream from '../event-write-stream';

let events = CreateWriteStream();

export default async (context) =>{
  const { magicbus } = context;
  const { consumer } = magicbus;

  const handler = (payload, messageTypes, raw) => {
    let transformed = transformEvent(payload, messageTypes, raw);
    return events.write(transformed);
  };

  await consumer.startConsuming(handler);
  return context;
};
