import grpc from '@grpc/grpc-js';
import { connect, hash, signers } from '@hyperledger/fabric-gateway';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');

const cryptoPath = envOrDefault(
    'CRYPTO_PATH',
    path.resolve(
        process.cwd(),
        '..', '..',
        'test-network',
        'organizations',
        'peerOrganizations',
        'org1.example.com'
    )
);

const keyDirectoryPath = envOrDefault(
    'KEY_DIRECTORY_PATH',
    path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore')
);

const certDirectoryPath = envOrDefault(
    'CERT_DIRECTORY_PATH',
    path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts')
);

const tlsCertPath = envOrDefault(
    'TLS_CERT_PATH',
    path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt')
);

const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');

function envOrDefault(key, defaultValue) {
    return process.env[key] || defaultValue;
}

export {
    channelName,
    mspId,
    cryptoPath,
    keyDirectoryPath,
    certDirectoryPath,
    tlsCertPath,
    peerEndpoint,
    peerHostAlias
}; 