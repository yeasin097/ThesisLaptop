import { getContract, utf8Decoder, getAllFromContract } from './fabricService.js';
import { fetchFromIPFS } from './ipfsService.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'node:fs';
import { getHash } from '../utils/hash.js';

const PYTHON_SERVER_URL = 'http://localhost:15000';

export async function registerPatientFromBiometric(filePath, filename, register) {
    try {
        const formData = new FormData();
        const fileStream = fs.createReadStream(filePath);

        formData.append("image", fileStream, {
            filename: filename,
            contentType: "image/bmp"
        });

        const pythonResponse = await axios.post(`${PYTHON_SERVER_URL}/match` , formData, {
            headers: {
                ...formData.getHeaders()
            }
        });
        
        // Delete temporary file after response
        fs.unlinkSync(filePath);
        const patientData = pythonResponse.data.citizen_data;
        const patientHash = getHash(patientData.nid_no);

        if(register) {
            const contractPatient = await getContract('patient');
            await contractPatient.submitTransaction('CreatePatient', JSON.stringify(patientData), patientHash);
        }
        
        return patientHash;
    } catch (error) {
        console.error("Error processing biometric:", error);
        throw error;
    }
}


export async function registerPatient(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No fingerprint image uploaded' });
        }

        const filePath = req.file.path;
        const response = await registerPatientFromBiometric(filePath, req.file.filename, true);

        if (response) {
            return res.status(200).json({ message: 'Patient registered successfully' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Failed to register patient',
            details: error.message
        });
    }
}

export async function findPatientInfo(req, res) {
    try {
        let hash;
        const contractPatient = await getContract('patient');
        
        if (req.body.nid_no) {
            // Search by NID number
            hash = getHash(req.body.nid_no);
        } else if (req.file) {
            // Search by fingerprint image
            const filePath = req.file.path;
            hash = await registerPatientFromBiometric(filePath, req.file.filename, false);
        } else {
            return res.status(400).json({ error: 'No fingerprint image uploaded or NID number provided' });
        }

        const patient = await contractPatient.evaluateTransaction('ReadPatient', hash);
        const patient_info = JSON.parse(utf8Decoder.decode(patient));
        
        return res.status(200).json({ message: 'Patient Found', patient_info: patient_info });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Failed to find patient',
            details: error.message
        });
    }
}


export async function getPatientEHRs(req, res) {
    try {
        let hash; // This will hold the patient hash (from fingerprint or NID)

        // Case 1: Fingerprint image provided
        if (req.file) {
            const filePath = req.file.path;
            hash = await registerPatientFromBiometric(filePath, req.file.filename, false);

            const contractPatient = await getContract('patient');
            const patientExist = await contractPatient.evaluateTransaction('PatientExists', hash);

            if (utf8Decoder.decode(patientExist) !== 'true') {
                return res.status(404).json({ error: 'Patient not found via fingerprint' });
            }
        }
        // Case 2: NID number provided
        else if (req.body.nid_no) {
            const nidNo = req.body.nid_no;

            
            hash = getHash(nidNo);
            const contractPatient = await getContract('patient');
            const patientExist = await contractPatient.evaluateTransaction('PatientExists', hash);

            if (utf8Decoder.decode(patientExist) !== 'true') {
                return res.status(404).json({ error: 'Patient not found via NID' });
            }
        }
        // Neither fingerprint nor NID provided
        else {
            return res.status(400).json({ error: 'No fingerprint image or NID number provided' });
        }

        // Fetch EHRs using the hash (works for both fingerprint and NID)
        const contractEHR = await getContract('ehr');
        const ehrData = await contractEHR.evaluateTransaction('GetEHRsByNIDHash', hash);
        const ehrs = JSON.parse(utf8Decoder.decode(ehrData));

        if(ehrs.length === 0) {
            return res.status(200).json({ message: 'No EHR records found for this patient' });
        }
        else if (!ehrs) {
            return res.status(404).json({ message: 'Failed to fetch EHR' });
        }

        // Fetch details from IPFS for each EHR
        const ehrDetails = await Promise.all(ehrs.map(async (ehr) => {
            const fileContent = await fetchFromIPFS(ehr.cid);
            return {
                ...ehr,
                details: JSON.parse(fileContent)
            };
        }));

        res.status(200).json({ message: 'EHRs fetched successfully', ehrs: ehrDetails });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch EHRs', details: error.message });
    }
}

export const getAllPatients = async () => {
    try {
        return await getAllFromContract('GetAllPatients');
    } catch (error) {
        console.error('Error getting all patients:', error);
        throw error;
    }
};



export const createPatient = async (patientData) => {
    try {
        const contract = getContract();
        const resultBytes = await contract.submitTransaction('CreatePatient', JSON.stringify(patientData));
        const resultJson = utf8Decoder.decode(resultBytes);
        return JSON.parse(resultJson);
    } catch (error) {
        console.error('Error creating patient:', error);
        throw error;
    }
};

export const updatePatient = async (nid, patientData) => {
    try {
        const contract = getContract();
        const resultBytes = await contract.submitTransaction('UpdatePatient', nid, JSON.stringify(patientData));
        const resultJson = utf8Decoder.decode(resultBytes);
        return JSON.parse(resultJson);
    } catch (error) {
        console.error('Error updating patient:', error);
        throw error;
    }
};

export const deletePatient = async (nid) => {
    try {
        const contract = getContract();
        await contract.submitTransaction('DeletePatient', nid);
        return true;
    } catch (error) {
        console.error('Error deleting patient:', error);
        throw error;
    }
}; 