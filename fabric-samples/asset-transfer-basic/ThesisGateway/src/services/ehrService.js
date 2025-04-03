import { getContract, utf8Decoder, getAllFromContract } from './fabricService.js';
import { uploadToIPFS, fetchFromIPFS } from './ipfsService.js';
import { getHash } from '../utils/hash.js';
import fs from 'node:fs';
import { registerPatientFromBiometric } from './patientService.js';

export const createEHR = async (req, res) => {
    try {
        const { doctor_id, hospital_id, ehr_details, nid_no } = req.body;
        //console.log(nid_no);

        // Parse ehr_details
        // console.log(doctor_id);
        const ehrDetailsParsed = ehr_details;
        // console.log(ehrDetailsParsed);
        let patientHash;

        // Case 1: Fingerprint provided (no nid_no)
        if (nid_no) {
            patientHash = getHash(nid_no); // Assuming patient_id is the hash
            console.log(nid_no);
            
        }
        // Case 2: nid_no provided (no fingerprint required)
        else if (req.file) {
            const filePath = req.file.path;
            // Get patient hash from fingerprint
            patientHash = await registerPatientFromBiometric(filePath, req.file.filename, false);
            
        }
        // Invalid case: Neither or both provided
        else {
            return res.status(400).json({ 
                error: 'Exactly one of fingerprint image or nid_no must be provided.' 
            });
        }

        // Verify patient exists
        const contractPatient = await getContract('patient');
        const patientExist = await contractPatient.evaluateTransaction('PatientExists', patientHash);
        if (utf8Decoder.decode(patientExist) !== 'true') {
            return res.status(404).json({ error: 'Patient does not exist, please register first.' });
        }

        // Get patient's full data
        const patientData = await contractPatient.evaluateTransaction('ReadPatient', patientHash);
        let patientInfo;
        try {
            patientInfo = JSON.parse(utf8Decoder.decode(patientData));
        } catch (error) {
            console.error('Error parsing patient data:', error);
            patientInfo = { blood_group: 'Unknown', gender: 'Unknown' };
        }

        // Verify doctor exists
        const contractDoctor = await getContract('doctor');
        const doctorExists = await contractDoctor.evaluateTransaction('DoctorExists', doctor_id);
        if (utf8Decoder.decode(doctorExists) !== 'true') {
            return res.status(404).json({ error: `Doctor with ID ${doctor_id} does not exist.` });
        }

        // Upload to IPFS
        const cid = await uploadToIPFS(JSON.stringify(ehrDetailsParsed));
        const ehr_id = getHash(cid + Date.now());

        const ehr_info = {
            ehr_id,
            patient_id: patientHash,
            doctor_id,
            hospital_id,
            cid
        };

        // Store on blockchain
        const contractEHR = await getContract('ehr');
        await contractEHR.submitTransaction('CreateEHR', String(ehr_id), JSON.stringify(ehr_info));

        res.status(201).json({ 
            message: 'EHR created successfully', 
            ehr_info: {
                ...ehr_info,
                details: ehrDetailsParsed
            }
        });
    } catch (error) {
        console.error('Error creating EHR:', error);
        res.status(500).json({ error: 'Failed to create EHR', details: error.message });
    }
};

export const getAllEHRs = async (req, res) => {
    try {
        const result = await getAllFromContract('GetAll', 'ehr');
        
        // If you need to fetch additional data from IPFS
        const ehrDetails = await Promise.all(result.map(async (ehr) => {
            try {
                if (ehr.cid) {
                    const fileContent = await fetchFromIPFS(ehr.cid);
                    const details = JSON.parse(fileContent);
                    return {
                        ...ehr,
                        details,
                        blood_group: ehr.blood_group || details.blood_group || 'Unknown'
                    };
                }
                return ehr;
            } catch (error) {
                console.error(`Error processing EHR ${ehr.ehr_id}:`, error);
                return {
                    ...ehr,
                    details: {},
                    blood_group: 'Unknown'
                };
            }
        }));

        res.status(200).json({ 
            message: 'EHRs fetched successfully', 
            ehrs: ehrDetails 
        });
    } catch (error) {
        console.error('Error getting all EHRs:', error);
        res.status(500).json({ 
            error: 'Failed to get EHRs', 
            details: error.message 
        });
    }
};

export const getEHRStats = async (req, res) => {
    try {
        const ehrs = await getAllFromContract('GetAll', 'ehr'); // Specify 'ehr' as the contract type

        const stats = {
            totalEHRs: ehrs.length,
            totalPatients: new Set(ehrs.map(ehr => ehr.patient_id)).size,
            totalDoctors: new Set(ehrs.map(ehr => ehr.doctor_id)).size,
            totalHospitals: new Set(ehrs.map(ehr => ehr.hospital_id)).size,
            // Add more statistics as needed
        };

        res.status(200).json({ message: 'EHR statistics fetched successfully', stats });
    } catch (error) {
        console.error('Error getting EHR stats:', error);
        res.status(500).json({ error: 'Failed to get EHR stats', details: error.message });
    }
};

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
        stats.diagnosisCount[diagnosis] = (stats.diagnosisCount[diagnosis] || 0) + 1;
        medications.flat().forEach(med => {
            stats.medicationCount[med] = (stats.medicationCount[med] || 0) + 1;
        });
        const allergy = test_results.allergy;
        stats.allergyCount[allergy] = (stats.allergyCount[allergy] || 0) + 1;
    });

    return stats;
} 