import grpc from '@grpc/grpc-js';
import { connect, hash, signers } from '@hyperledger/fabric-gateway';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { TextDecoder } from 'node:util';
import express from 'express';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import axios from 'axios';

import FormData from 'form-data';
import multer from 'multer';
import fs2 from 'node:fs';




const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');

const ipfs = ipfsHttpClient({ host: 'localhost', port: 5001, protocol: 'http' });

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

const utf8Decoder = new TextDecoder();

let gateway;
let client;
// Declare global contract variables so helper functions can use them.
let contractPatient, contractDoctor, contractEHR;

async function main() {
    displayInputParameters();
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

    const app = express();
    const port = 8000;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });


    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/')
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname)
        }
    });
    
    const upload = multer({ storage: storage });
    
    // Python server URL
    const PYTHON_SERVER_URL = 'http://localhost:15000/match';

    const network = gateway.getNetwork(channelName);

    // Assign the contracts to the global variables.
    contractPatient = network.getContract('patient');
    contractDoctor  = network.getContract('doctor');
    contractEHR     = network.getContract('ehr');

    app.get('/', (req, res) => res.send('Welcome to the EHR System'));

    app.get('/test_ipfs', async (req, res) => {
        try {
            const fileContent = await fetchFromIPFS("QmZaEQdUN9aj2UXzac2QHgDq5k2PHm6kMi17zJpRwwgKnm");
            console.log(fileContent);
            res.send(fileContent);
        } catch (error) {
            console.error("IPFS error:", error);
            res.status(500).send("Failed to fetch from IPFS");
        }
    });

    app.post('/create_ehr', upload.single('fingerprint'), async (req, res) => {
        try {
            const {doctor_id, hospital_id, ehr_details } = req.body;

            if (!req.file) {
                return res.status(400).json({ error: 'No fingerprint image uploaded' });
            }

            // console.log(doctor_id + " " + hospital_id + " " + ehr_details);
    
            // console.log('Received file:', req.file.filename);

            const ehrDetailsParsed = JSON.parse(ehr_details);

            // console.log('Received Fingerprint:', req.file.filename);
            // console.log('EHR Details:', ehrDetailsParsed);
    
    
            const filePath = req.file.path; // Store the path
            const register=false;
            const patientHash = await registerPatientFromBiometric(filePath, req.file.filename, register);
            // Verify if the patient exists
            const patientExist = await contractPatient.evaluateTransaction('PatientExists', patientHash);
            if (utf8Decoder.decode(patientExist) !== 'true') {
                console.log("Patient with this fingerprint does not exist, please register first.");
                return res.status(404).json({ error: `Patient does not exist.` });
            }
    
            // ✅ **Check if the doctor exists**
            const doctorExists = await contractDoctor.evaluateTransaction('DoctorExists', doctor_id);
            if (utf8Decoder.decode(doctorExists) !== 'true') {
                return res.status(404).json({ error: `Doctor with ID ${doctor_id} does not exist.` });
            }
    
            // Upload EHR details to IPFS
            const cid = await uploadToIPFS(ehr_details);
    
            // Generate a unique EHR ID using a hash of the CID and the details.
            const ehr_id = getHash(cid +Date.now());
    
            // Create EHR object (for logging/response purposes)
            const ehr_info = {
                ehr_id,
                patient_id: patientHash,
                doctor_id,
                hospital_id,
                cid
            };
    
            // Submit transaction to store EHR on the blockchain.
            await contractEHR.submitTransaction('CreateEHR', String(ehr_id), JSON.stringify(ehr_info));
            console.log(JSON.stringify(ehr_info));
    
            res.status(201).json({ message: 'EHR created successfully', ehr_info });
    
        } catch (error) {
            console.error('Error creating EHR:', error);
            res.status(500).json({ error: 'Failed to create EHR', details: error.message });
        }
    });
    

    // app.post('/register_patient', async (req, res) => {
    //     const { nid_no } = req.body;
    
    //     try {
    //         const result = await register_patient_from_nid(nid_no);
    //         if (result) {
    //             console.log("Patient registration successful.");
    //             res.status(200).json({ message: 'Patient created successfully' });
    //         } else {
    //             res.status(500).json({ error: 'Patient registration failed' });
    //         }
    
    //     } catch (error) {
    //         res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "NID Server Error" });
    //     }
    // });


    app.post('/register_patient', upload.single('fingerprint'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No fingerprint image uploaded' });
            }
    
            console.log('Received file:', req.file.filename);
    
            const filePath = req.file.path; // Store the path
            const register = true;
            const response = await registerPatientFromBiometric(filePath, req.file.filename, register);
    
            if (response) {
                console.log("Patient registration successful.");
                return res.status(200).json({ message: 'Patient created successfully' });
            } else {
                return res.status(500).json({ error: 'Patient registration failed' });
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).json({
                error: 'Failed to process fingerprint',
                details: error.message
            });
        }
    });
    
    app.post('/find_patient_info', upload.single('fingerprint'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No fingerprint image uploaded' });
            }
    
            console.log('Received file:', req.file.filename);
    
            const filePath = req.file.path; // Store the path
            const register=false;
            const hash = await registerPatientFromBiometric(filePath, req.file.filename, register);

            const patientExist = await contractPatient.evaluateTransaction('PatientExists', hash);
            if (utf8Decoder.decode(patientExist) !== 'true') {
                return res.status(404).json({ error: `Patient with NID: ${nid_no} does not exist.` });
            }  
            else {
                return res.status(200).json({ message: 'Patient Found' });
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).json({
                error: 'Failed to process fingerprint',
                details: error.message
            });
        }
    });

    //     app.post('/find-fingerprint', upload.single('fingerprint'), async (req, res) => {
    //     try {
    //         // Check if file exists
    //         if (!req.file) {
    //             return res.status(400).json({ error: 'No fingerprint image uploaded' });
    //         }
    
    //         console.log('Received file:', req.file.filename);
    
    //         // Create form data for Python server
    //         const formData = new FormData();
    //         const fileStream = fs2.readFileSync(req.file.path);  // Changed to readFileSync
    //         formData.append('image', fileStream, {
    //             filename: req.file.filename,
    //             contentType: 'image/bmp'
    //         });
    
    //         // Send to Python server
    //         const pythonResponse = await axios.post(PYTHON_SERVER_URL, formData, {
    //             headers: {
    //                 ...formData.getHeaders()
    //             }
    //         });
    
    //         // Delete the temporary file
    //         fs2.unlinkSync(req.file.path);  // Changed to unlinkSync
    
    //         // Return the response from Python server
    //         res.json({
    //             message: 'Fingerprint processed successfully',
    //             result: pythonResponse.data
    //         });
    
    //     } catch (error) {
    //         console.error('Error:', error.message);
    //         res.status(500).json({
    //             error: 'Failed to process fingerprint',
    //             details: error.message
    //         });
    //     }
    // });



    app.get('/get_patient_ehrs', upload.single('fingerprint'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No fingerprint image uploaded' });
            }
    
            console.log('Received file:', req.file.filename);
    
            const filePath = req.file.path; // Store the path
            const register=false;
            const hash = await registerPatientFromBiometric(filePath, req.file.filename, register);

            // Verify if the patient exists
            const patientExist = await contractPatient.evaluateTransaction('PatientExists', hash);
            if (utf8Decoder.decode(patientExist) !== 'true') {
                return res.status(404).json({ error: `Patient with NID: ${nid_no} does not exist.` });
            }
    
            // Fetch all EHRs belonging to this patient
            const ehrData = await contractEHR.evaluateTransaction('GetEHRsByNIDHash', hash);
            const ehrs = JSON.parse(utf8Decoder.decode(ehrData));
    
            // Check if no EHRs exist for the patient
            if (!ehrs || ehrs.length === 0) {
                return res.status(404).json({ message: `No EHR records found for patient with NID: ${nid_no}` });
            }
    
            // Fetch EHR content from IPFS
            const ehrDetails = await Promise.all(ehrs.map(async (ehr) => {
                const fileContent = await fetchFromIPFS(ehr.cid);
                return {
                    ...ehr,
                    details: JSON.parse(fileContent)
                };
            }));
    
            res.status(200).json({ message: 'EHRs fetched successfully', ehrs: ehrDetails });
    
        } catch (error) {
            console.error('Error fetching EHRs:', error);
            res.status(500).json({ error: 'Failed to fetch EHRs', details: error.message });
        }
    });
    
    app.post('/create_doctor', async (req, res) => {
        try {
            const { bmdcNo, name } = req.body;
    
            if (!bmdcNo || !name) {
                return res.status(400).json({ error: 'BMDC Number and Name are required.' });
            }
    
            // Generate doctor ID
            const doctorID = `d${bmdcNo}`;
    
            // Check if doctor already exists
            const doctorExists = await contractDoctor.evaluateTransaction('DoctorExists', doctorID);
            if (utf8Decoder.decode(doctorExists) === 'true') {
                return res.status(400).json({ error: `Doctor with ID ${doctorID} already exists.` });
            }
    
            // Create doctor in the blockchain
            await contractDoctor.submitTransaction('CreateDoctor', bmdcNo, name);
    
            res.status(201).json({ message: 'Doctor created successfully', doctorID, name });
    
        } catch (error) {
            console.error('Error creating doctor:', error);
            res.status(500).json({ error: 'Failed to create doctor', details: error.message });
        }
    });

    app.get('/get_ehr_stats', async (req, res) => {
        try {
            const ehrs = await getAll(contractEHR);
    
            const ehrDetails = await Promise.all(ehrs.map(async (ehr) => {
                const fileContent = await fetchFromIPFS(ehr.cid);
                return {
                    ...ehr,
                    details: JSON.parse(fileContent)
                };
            }));
    
            const stats = generateEHRStats(ehrDetails);
    
            res.status(200).json({ message: 'EHR statistics fetched successfully', stats });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    app.get('/get_all_ehrs', async (req, res) => {
        try {

            // const ehrData = await contractEHR.evaluateTransaction('GetEHRsByNIDHash', hash);
            // const ehrs = JSON.parse(utf8Decoder.decode(ehrData));
            const ehrs = await getAll(contractEHR);
            // console.log(result);
            // res.send(result);
            const ehrDetails = await Promise.all(ehrs.map(async (ehr) => {
                const fileContent = await fetchFromIPFS(ehr.cid);
                return {
                    ...ehr,
                    details: JSON.parse(fileContent)
                };
            }));

            res.status(200).json({ message: 'EHRs fetched successfully', ehrs: ehrDetails });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/get_all_patients', async (req, res) => {
        try {
            const result = await getAll(contractPatient);
            const realJson = result.map(item => JSON.parse(item));
            
            res.json(realJson);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/get_all_doctor', async (req, res) => {
        try {
            const result = await getAll(contractDoctor);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    process.on('SIGINT', () => {
        console.log('Shutting down gracefully...');
        if (gateway) gateway.close();
        if (client) client.close();
        process.exit();
    });
}

main().catch((error) => {
    console.error('Failed to start application:', error);
    process.exitCode = 1;
});

async function newGrpcConnection() {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity() {
    const certPath = await getFirstDirFileName(certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function getFirstDirFileName(dirPath) {
    const files = await fs.readdir(dirPath);
    if (!files.length) throw new Error(`No files in directory: ${dirPath}`);
    return path.join(dirPath, files[0]);
}

async function newSigner() {
    const keyPath = await getFirstDirFileName(keyDirectoryPath);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

function envOrDefault(key, defaultValue) {
    return process.env[key] || defaultValue;
}

function displayInputParameters() {
    console.log(`Channel Name: ${channelName}`);
    console.log(`MSP ID: ${mspId}`);
    console.log(`Crypto Path: ${cryptoPath}`);
    console.log(`Peer Endpoint: ${peerEndpoint}`);
    console.log(`Peer Host Alias: ${peerHostAlias}`);
}

function getHash(value, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(value).digest('hex');
}

async function uploadToIPFS(data) {
    // If data is not a Buffer or string, we stringify it.
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const { cid } = await ipfs.add(payload);
    console.log("File uploaded to IPFS with CID:", cid.toString());
    return cid.toString();
}

async function fetchFromIPFS(cid) {
    let data = [];
    for await (const chunk of ipfs.cat(cid)) {
        data.push(...chunk);
    }
    return Buffer.from(data).toString();
}


async function register_patient_from_nid(nid_no) {
    try {
        // Call the external NID server to get patient info.
        // console.log(nid_no);
        const response = await axios.post('http://localhost:4000/get_citizen_info', { nid_no });
        // console.log(response.data);
        
        
        // Assuming response.data contains the patient details.
        const patientData = response.data;
        
        // Generate patient hash from the NID (or from patientData.nid_no if needed)
        const patientHash = getHash(patientData.nid_no || nid_no);
        // console.log(patientHash);
        // console.log(patientData);
        
        // You may need to stringify or pass individual properties from patientData based on your chaincode.
        // For example, here we assume the chaincode accepts a JSON string and a hash.
        await contractPatient.submitTransaction('CreatePatient', JSON.stringify(patientData), patientHash);
        return true;
    } catch (error) {
        console.error("Error registering patient:", error);
        return false;
    }
}


async function getAll(contract) {
    console.log('Fetching all');
    const resultBytes = await contract.evaluateTransaction('GetAll');
    const parsedList = JSON.parse(utf8Decoder.decode(resultBytes));
    return parsedList;
    

}



function generateEHRStats(ehrs) {
    const stats = {
        totalEHRs: ehrs.length,
        totalPatients: new Set(ehrs.map(ehr => ehr.patient_id)).size,
        totalDoctors: new Set(ehrs.map(ehr => ehr.doctor_id)).size,
        totalHospitals: new Set(ehrs.map(ehr => ehr.hospital_id)).size,
        diagnosisCount: {},
        medicationCount: {},
        allergyCount: {}
    };

    ehrs.forEach(ehr => {
        const { diagnosis, medications, test_results } = ehr.details;

        // Count Diagnoses
        stats.diagnosisCount[diagnosis] = (stats.diagnosisCount[diagnosis] || 0) + 1;

        // Count Medications
        medications.flat().forEach(med => {
            stats.medicationCount[med] = (stats.medicationCount[med] || 0) + 1;
        });

        // Count Allergies
        const allergy = test_results.allergy;
        stats.allergyCount[allergy] = (stats.allergyCount[allergy] || 0) + 1;
    });

    return stats;
}

async function registerPatientFromBiometric(filePath, filename, register) {
    try {
        const PYTHON_SERVER_URL = 'http://localhost:15000/match';
        const formData = new FormData();
        const fileStream = fs2.createReadStream(filePath);

        formData.append("image", fileStream, {
            filename: filename,
            contentType: "image/bmp"
        });

        const pythonResponse = await axios.post(PYTHON_SERVER_URL, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });
        // Delete temporary file after response
        fs2.unlinkSync(filePath);
        const patientData = pythonResponse.data.citizen_data;
        const patientHash = getHash(patientData.nid_no);

        // console.log("Python Server Response:", pythonResponse.data.citizen_data);
        if(register) {
            
            
            await contractPatient.submitTransaction('CreatePatient', JSON.stringify(patientData), patientHash);
        }
        
        console.log(patientData.nid_no);
        return patientHash;
    } catch (error) {
        console.error("Error registering patient:", error);
        return false;
    }
}