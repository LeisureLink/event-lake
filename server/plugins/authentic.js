import voucher from '@leisurelink/hapi-voucher';
import { auth } from '../env';

let endpointId = auth.endpointKeyId.split('/')[0];
let keyName = auth.endpointKeyId.split('/')[1];

console.log(auth.authenticKeyPath);

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
      url: auth.authenticUrl,
      publicKeyPath: auth.authenticKeyPath
    }
  }
};
