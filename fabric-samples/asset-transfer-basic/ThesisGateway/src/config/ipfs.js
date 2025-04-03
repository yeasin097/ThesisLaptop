import { create as ipfsHttpClient } from 'ipfs-http-client';

const ipfs = ipfsHttpClient({ host: 'localhost', port: 5001, protocol: 'http' });

export default ipfs; 