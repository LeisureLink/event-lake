
export default {
  method: 'GET',
  path: '/test-signing',
  config: {
    description: 'Send a request using trusted client to verify it works',
    tags: ['test'],
    auth: 'trusted'
  },
  handler: (req, rep) => {
    rep({ message: 'Hello world' });
  }
};
