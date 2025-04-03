import express from 'express';
import { getAllFromContract } from '../services/fabricService.js';
import { 
    exportEHRDataCSV, 
    exportFilteredEHRDataCSV,
    getFiltersMetadata,
    getPreviewData
} from '../services/researcherService.js';

const router = express.Router();

// Get all research data
router.get('/all', async (req, res) => {
    try {
        const result = await getAllFromContract('GetAll', 'research');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export all EHR data as CSV
router.get('/export/csv', exportEHRDataCSV);

// Export filtered EHR data as CSV
router.post('/export/filtered-csv', exportFilteredEHRDataCSV);

// Get preview data with filters applied
router.post('/preview', getPreviewData);

// Get available filters metadata
router.get('/filters', getFiltersMetadata);

// Get available metrics and filters
router.get('/metadata', async (req, res) => {
    try {
        const metadata = {
            metrics: [
                'Age Distribution',
                'Gender Ratio',
                'Blood Group Distribution',
                'Diagnosis Patterns',
                'Treatment Outcomes'
            ],
            filters: {
                bloodGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
                genders: ['Male', 'Female', 'Other'],
                ageRanges: ['0-20', '21-35', '36-50', '51-65', '65+'],
            }
        };
        res.json(metadata);
    } catch (error) {
        console.error('Metadata fetch failed:', error);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
});

export default router;