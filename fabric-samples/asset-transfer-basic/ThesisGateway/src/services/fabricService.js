import grpc from '@grpc/grpc-js';
import { connect, hash, signers } from '@hyperledger/fabric-gateway';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { TextDecoder } from 'node:util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Global variables for contracts
let gateway;
let client;
let contractPatient, contractDoctor, contractEHR, contractResearch;

// Configuration
const channelName = process.env.CHANNEL_NAME || 'mychannel';
const mspId = process.env.MSP_ID || 'Org1MSP';

const cryptoPath = process.env.CRYPTO_PATH || path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'test-network',
    'organizations',
    'peerOrganizations',
    'org1.example.com'
);

const keyDirectoryPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore');
const certDirectoryPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts');
const tlsCertPath = path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
const peerEndpoint = process.env.PEER_ENDPOINT || 'localhost:7051';
const peerHostAlias = process.env.PEER_HOST_ALIAS || 'peer0.org1.example.com';

export const utf8Decoder = new TextDecoder();

async function newGrpcConnection() {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity() {
    const files = await fs.readdir(certDirectoryPath);
    const certPath = path.join(certDirectoryPath, files[0]);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function newSigner() {
    const files = await fs.readdir(keyDirectoryPath);
    const keyPath = path.join(keyDirectoryPath, files[0]);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

export const initializeFabric = async () => {
    try {
        client = await newGrpcConnection();

        gateway = connect({
            client,
            identity: await newIdentity(),
            signer: await newSigner(),
            hash: hash.sha256,
            evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
            endorseOptions: () => ({ deadline: Date.now() + 15000 }),
            submitOptions: () => ({ deadline: Date.now() + 5000 }),
            commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
        });

        const network = gateway.getNetwork(channelName);

        // Initialize all contracts
        contractPatient = network.getContract('patient');
        contractDoctor = network.getContract('doctor');
        contractEHR = network.getContract('ehr');
        contractResearch = network.getContract('research');

        console.log('Successfully connected to Fabric network and initialized all contracts');
    } catch (error) {
        console.error('Failed to initialize Fabric connection:', error);
        throw error;
    }
};

export const getContract = (contractType = 'patient') => {
    const contracts = {
        patient: contractPatient,
        doctor: contractDoctor,
        ehr: contractEHR,
        research: contractResearch
    };

    const contract = contracts[contractType];
    if (!contract) {
        throw new Error(`Contract ${contractType} not initialized. Call initializeFabric first.`);
    }
    return contract;
};

export const getAllFromContract = async (functionName, contractType = 'patient') => {
    try {
        const contract = getContract(contractType);
        const resultBytes = await contract.evaluateTransaction(functionName);
        const resultJson = utf8Decoder.decode(resultBytes);
        return JSON.parse(resultJson);
    } catch (error) {
        console.error(`Error getting all from contract ${contractType} using ${functionName}:`, error);
        throw error;
    }
};

export const disconnectFabric = () => {
    if (gateway) {
        gateway.close();
    }
    if (client) {
        client.close();
    }
};

// Helper function to get hash
export const getHash = (value, algorithm = 'sha256') => {
    return crypto.createHash(algorithm).update(value).digest('hex');
}; 