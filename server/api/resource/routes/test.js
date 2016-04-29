
export default {
  method: 'GET',
  path:  '/test' ,
  config: {
    description: 'Send a request to see if it works.',
    tags: ['test']
  },
  handler: (req, rep) => {
    rep({ message: 'Hello world' });
  }
};
