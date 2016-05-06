import voucher from '@leisurelink/hapi-voucher';
import { auth } from '../env';

let principalId = auth.endpointKeyId.split('/')[0];
let keyId = auth.endpointKeyId.split('/')[1];

export default {
  register: voucher,
  options: {
    auth: {
      issuer: auth.issuer,
      audience: auth.audience,
      principalId: principalId,
      keyId: keyId,
      privateKeyPath: auth.endpointKeyPath
    },
    authentic: {
      url: auth.authenticUrl,
      publicKeyPath: auth.authenticKeyPath
    }
  }
};
