import { getAllFromContract } from './fabricService.js';
import { fetchFromIPFS } from './ipfsService.js';
import { parse } from 'json2csv';

// Helper function to calculate age group
const calculateAgeGroup = (dateOfBirth) => {
    try {
        if (!dateOfBirth) return 'Unknown';

        let birthDate = new Date(dateOfBirth);

        // If the initial parse fails, try "DD/MM/YYYY" format
        if (isNaN(birthDate.getTime())) {
            const parts = dateOfBirth.split('/');
            if (parts.length === 3) {
                birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // Convert to YYYY-MM-DD
            }
        }

        // If still invalid, return "Unknown"
        if (isNaN(birthDate.getTime())) {
            return 'Unknown';
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 0) return 'Unknown';
        if (age <= 20) return '0-20';
        else if (age <= 35) return '21-35';
        else if (age <= 50) return '36-50';
        else if (age <= 65) return '51-65';
        else return '65+';
    } catch (error) {
        return 'Unknown';
    }
};

// Normalize gender value
const normalizeGender = (gender) => {
    if (!gender) return 'Unknown';
    
    const normalizedGender = String(gender).trim().toLowerCase();
    
    if (['m', 'male', 'man'].includes(normalizedGender)) {
        return 'Male';
    } else if (['f', 'female', 'woman'].includes(normalizedGender)) {
        return 'Female';
    } else {
        return String(gender).trim() || 'Unknown';
    }
};

export const getPreviewData = async (req, res) => {
  try {
      const {
          ageGroups,
          genders,
          diagnoses,
          bloodGroups,
          limit = 10
      } = req.body;

      // Get all EHRs
      const ehrs = await getAllFromContract('GetAll', 'ehr');
      let filteredRecords = [];
      
      // Process EHRs
      for (const ehr of ehrs) {
          try {
              // Get EHR details from IPFS with double JSON parse
              const ehrDetails = await fetchFromIPFS(ehr.cid);
              const details = JSON.parse(JSON.parse(ehrDetails));

              const dateOfBirth = details.date_of_birth;
              const gender = normalizeGender(details.gender);
              const ageGroup = calculateAgeGroup(dateOfBirth);
              const bloodGroup = ehr.blood_group || details.blood_group || 'Unknown';

              // Check if record matches filters
              if (ageGroups && ageGroups.length > 0 && !ageGroups.includes(ageGroup)) continue;
              if (genders && genders.length > 0 && !genders.includes(gender)) continue;
              if (diagnoses && diagnoses.length > 0 && !diagnoses.includes(details.diagnosis)) continue;
              if (bloodGroups && bloodGroups.length > 0 && !bloodGroups.includes(bloodGroup)) continue;

              // Process medications
              let medications = 'None';
              if (details.medications && Array.isArray(details.medications)) {
                  const validMeds = details.medications.flat().filter(med => med && String(med).trim());
                  if (validMeds.length > 0) {
                      medications = validMeds.join(', ');
                  }
              }

              // Create record for preview
              const record = {
                  Age_Group: ageGroup,
                  Gender: gender,
                  Diagnosis: details.diagnosis || 'Unknown',
                  Medication: medications,
                  Blood_Pressure: details.test_results?.blood_pressure || 'N/A',
                  Cholesterol: details.test_results?.cholesterol || 'N/A',
                  Allergy: details.test_results?.allergy || 'None',
                  Blood_Group: bloodGroup,
                  notes: details.notes || 'No comments'
              };
              filteredRecords.push(record);

              // Stop once we reach the limit
              if (filteredRecords.length >= limit) {
                  break;
              }
          } catch (error) {
              console.error(`Error processing EHR ${ehr?.ehr_id || 'unknown'}: ${error.message}`);
              continue;
          }
      }

      res.json(filteredRecords);
  } catch (error) {
      res.status(500).json({ 
          error: 'Failed to fetch preview data', 
          details: error.message 
      });
  }
};

export const exportEHRDataCSV = async (req, res) => {
    try {
        const ehrs = await getAllFromContract('GetAll', 'ehr');
        let allRecords = [];

        for (const ehr of ehrs) {
            try {
                // Fetch and parse EHR details from IPFS - double JSON parse as per your working code
                const ehrDetails = await fetchFromIPFS(ehr.cid);
                const details = JSON.parse(JSON.parse(ehrDetails));

                const dateOfBirth = details.date_of_birth;
                const gender = normalizeGender(details.gender);
                const ageGroup = calculateAgeGroup(dateOfBirth);

                // Process medications
                let medications = 'None';
                if (details.medications && Array.isArray(details.medications)) {
                    const validMeds = details.medications.flat().filter(med => med && String(med).trim());
                    if (validMeds.length > 0) {
                        medications = validMeds.join(', ');
                    }
                }

                // Create single record with combined medications
                const record = {
                    Age_Group: ageGroup,
                    Gender: gender,
                    Diagnosis: details.diagnosis || 'Unknown',
                    Medication: medications,
                    Blood_Pressure: details.test_results?.blood_pressure || 'N/A',
                    Cholesterol: details.test_results?.cholesterol || 'N/A',
                    Allergy: details.test_results?.allergy || 'None',
                    Blood_Group: ehr.blood_group || details.blood_group || 'Unknown',
                    notes: details.notes || 'No comments'
                };
                allRecords.push(record);
            } catch (error) {
                console.error(`Error processing EHR ${ehr?.ehr_id || 'unknown'}: ${error.message}`);
                // Fallback record on error
                allRecords.push({
                    Age_Group: 'Unknown',
                    Gender: 'Unknown',
                    Diagnosis: 'Unknown',
                    Medication: 'None',
                    Blood_Pressure: 'N/A',
                    Cholesterol: 'N/A',
                    Allergy: 'None',
                    Blood_Group: 'Unknown',
                    notes: 'No comments'
                });
            }
        }

        const fields = [
            'Age_Group',
            'Gender',
            'Diagnosis',
            'Medication',
            'Blood_Pressure',
            'Cholesterol',
            'Allergy',
            'Blood_Group',
            'notes'
        ];

        const csv = parse(allRecords, { fields });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=ehr_research_data.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to export EHR data', 
            details: error.message 
        });
    }
};

// Add filter functionality for more specific exports
export const exportFilteredEHRDataCSV = async (req, res) => {
    try {
        const {
            ageGroups,
            genders,
            diagnoses,
            bloodGroups,
            dateRange
        } = req.body;

        // Get all EHRs
        const ehrs = await getAllFromContract('GetAll', 'ehr');
        let allRecords = [];
        
        // Process EHRs
        for (const ehr of ehrs) {
            try {
                // Get EHR details from IPFS with double JSON parse
                const ehrDetails = await fetchFromIPFS(ehr.cid);
                const details = JSON.parse(JSON.parse(ehrDetails));

                const dateOfBirth = details.date_of_birth;
                const gender = normalizeGender(details.gender);
                const ageGroup = calculateAgeGroup(dateOfBirth);

                // Check if record matches filters
                if (ageGroups && ageGroups.length > 0 && !ageGroups.includes(ageGroup)) continue;
                if (genders && genders.length > 0 && !genders.includes(gender)) continue;
                if (diagnoses && diagnoses.length > 0 && !diagnoses.includes(details.diagnosis)) continue;
                if (bloodGroups && bloodGroups.length > 0 && !bloodGroups.includes(details.blood_group)) continue;

                // Process medications
                let medications = 'None';
                if (details.medications && Array.isArray(details.medications)) {
                    const validMeds = details.medications.flat().filter(med => med && String(med).trim());
                    if (validMeds.length > 0) {
                        medications = validMeds.join(', ');
                    }
                }

                // Create single record with combined medications  
                const record = {
                    Age_Group: ageGroup,
                    Gender: gender,
                    Diagnosis: details.diagnosis || 'Unknown',
                    Medication: medications,
                    Blood_Pressure: details.test_results?.blood_pressure || 'N/A',
                    Cholesterol: details.test_results?.cholesterol || 'N/A',
                    Allergy: details.test_results?.allergy || 'None',
                    Blood_Group: details.blood_group || 'Unknown',
                    notes: details.notes || 'No comments'
                };
                allRecords.push(record);

            } catch (error) {
                console.error(`Error processing EHR ${ehr?.ehr_id || 'unknown'}: ${error.message}`);
                continue;
            }
        }

        // Define fields for CSV
        const fields = [
            'Age_Group',
            'Gender',
            'Diagnosis',
            'Medication',
            'Blood_Pressure',
            'Cholesterol',
            'Allergy',
            'Blood_Group',
            'notes'
        ];

        const csv = parse(allRecords, { fields });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=ehr_research_data.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to export EHR data', 
            details: error.message 
        });
    }
};

// New function to get available filters metadata
export const getFiltersMetadata = async (req, res) => {
    try {
        const ehrs = await getAllFromContract('GetAll', 'ehr');
        
        // Initialize filters with default values
        const filters = {
            ageGroups: ['0-20', '21-35', '36-50', '51-65', '65+'],
            genders: ['Male', 'Female', 'Other'],
            bloodGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
            diagnoses: []
        };

        // Get unique diagnoses from EHR data
        for (const ehr of ehrs) {
            try {
                const ehrDetails = await fetchFromIPFS(ehr.cid);
                const details = JSON.parse(JSON.parse(ehrDetails));
                
                if (details.diagnosis && !filters.diagnoses.includes(details.diagnosis)) {
                    filters.diagnoses.push(details.diagnosis);
                }
            } catch (error) {
                console.error(`Error fetching diagnosis for EHR ${ehr?.ehr_id || 'unknown'}: ${error.message}`);
                continue;
            }
        }

        res.json(filters);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};