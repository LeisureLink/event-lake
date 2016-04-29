import events from './events';

export default async (context) =>{
  const { magicbus } = context;
  const { subscriber } = magicbus;

  subscriber.on(events.domain.onUpdated, (event, data) =>{
    console.log(event, data);
  });

  await subscriber.startSubscription();
  return context;
};
