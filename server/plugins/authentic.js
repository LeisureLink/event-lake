import voucher from '@leisurelink/hapi-voucher';
import { auth } from '../env';

let endpointId = auth.endpointKeyId.split('/')[0];
let keyName = auth.endpointKeyId.split('/')[1];

export default {
  register: voucher,
  options: {
    auth: {
      issuer: auth.issuer,
      audience: auth.audience,
      endpointId: endpointId,
      keyName: keyName,
      privateKeyPath: auth.endpointKeyPath
    },
    authentic: {
      url: process.env.EVENT_LAKE_AUTHENTIC_URL,
      publicKeyPath: process.env.EVENT_LAKE_AUTHENTIC_PUBLIC_KEY_PATH
    }
  }
};
