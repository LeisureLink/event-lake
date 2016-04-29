import voucher from '@leisurelink/hapi-voucher';
import path from 'path';

export default {
  register: voucher,
  options: {
    auth: {
      issuer: 'event-lake',
      audience: 'self',
      privateKeyPath: path.join(__dirname, '../../event-lake-key.pem')
    },
    authentic: {
      url: process.env.EVENT_LAKE_AUTHENTIC_URL,
      publicKeyPath: process.env.EVENT_LAKE_AUTHENTIC_PUBLIC_KEY_PATH
    }
  }
};
