import loggins from '@leisurelink/skinny-loggins';

const settings = {
  level: process.env.LOG_LEVEL,
  transports: {
    Console: {
      level: process.env.LOG_LEVEL
    }
  }
};

if((process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'stage') && process.env.LOGSTASH_HOST){
  settings.transports.Logstash = {
    host: process.env.LOGSTASH_HOST,
    port: parseInt(process.env.LOGSTASH_PORT, 10),
    'node_name': 'event-lake'
  };
}

export default loggins(settings);
