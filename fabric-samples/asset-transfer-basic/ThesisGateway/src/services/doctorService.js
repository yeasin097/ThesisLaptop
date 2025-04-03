import { getContract, utf8Decoder, getAllFromContract } from './fabricService.js';

export async function getAllDoctors(req, res) {
    try {
        const doctors = await getAllFromContract('GetAll', 'doctor'); // Changed to match your chaincode function name
        res.status(200).json(doctors);
    } catch (error) {
        console.error('Error getting all doctors:', error);
        res.status(500).json({ 
            error: 'Failed to get doctors', 
            details: error.message 
        });
    }
}

export async function createDoctor(req, res) {
    try {
        const { bmdcNo, name } = req.body;

        if (!bmdcNo || !name) {
            return res.status(400).json({ error: 'BMDC Number and Name are required.' });
        }

        const doctorID = `d${bmdcNo}`;

        const contractDoctor = await getContract('doctor');
        const doctorExists = await contractDoctor.evaluateTransaction('DoctorExists', doctorID);
        
        if (utf8Decoder.decode(doctorExists) === 'true') {
            return res.status(400).json({ error: `Doctor with ID ${doctorID} already exists.` });
        }

        await contractDoctor.submitTransaction('CreateDoctor', bmdcNo, name);
        res.status(201).json({ message: 'Doctor created successfully', doctorID, name });

    } catch (error) {
        console.error('Error creating doctor:', error);
        res.status(500).json({ error: 'Failed to create doctor', details: error.message });
    }
}

export async function getDoctorByID(req, res) {
    try {
        const { id } = req.params;
        const contract = getContract('doctor');
        const resultBytes = await contract.evaluateTransaction('ReadDoctor', id);
        const doctor = JSON.parse(utf8Decoder.decode(resultBytes));
        res.status(200).json(doctor);
    } catch (error) {
        console.error('Error getting doctor by ID:', error);
        res.status(500).json({ 
            error: 'Failed to get doctor', 
            details: error.message 
        });
    }
} 