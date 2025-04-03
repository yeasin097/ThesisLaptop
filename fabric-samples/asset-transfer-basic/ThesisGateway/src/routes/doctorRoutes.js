import express from 'express';
import { getContract, utf8Decoder, getAllFromContract } from '../services/fabricService.js';

const router = express.Router();

router.get('/all', async (req, res) => {
    try {
        const result = await getAllFromContract('GetAll', 'doctor');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/create', async (req, res) => {
    try {
        const { bmdcNo, name } = req.body;

        if (!bmdcNo || !name) {
            return res.status(400).json({ error: 'BMDC Number and Name are required.' });
        }

        const doctorID = `d${bmdcNo}`;
        const contract = getContract('doctor');
        
        const doctorExists = await contract.evaluateTransaction('DoctorExists', doctorID);
        if (utf8Decoder.decode(doctorExists) === 'true') {
            return res.status(400).json({ error: `Doctor with ID ${doctorID} already exists.` });
        }

        await contract.submitTransaction('CreateDoctor', bmdcNo, name);
        res.status(201).json({ message: 'Doctor created successfully', doctorID, name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const contract = getContract('doctor');
        const resultBytes = await contract.evaluateTransaction('ReadDoctor', id);
        const doctor = JSON.parse(utf8Decoder.decode(resultBytes));
        res.status(200).json(doctor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 