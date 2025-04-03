import { useLocation } from 'react-router-dom';
import EhrForm from '../components/EhrForm';

function CreateEhr() {
  const { state } = useLocation();
  const patient = state?.patient; // Patient data if from patient list

  return (
    <div className="container py-5">
      <h2 className="mb-4">Create EHR</h2>
      {patient && (
        <p className="mb-3">Creating EHR for {patient.name} (NID: {patient.nid_no})</p>
      )}
      <EhrForm
        doctorId="d0001" // Replace with actual doctor ID
        hospitalId="h001" // Replace with actual hospital ID
        nidNo={patient?.nid_no} // Pass NID if coming from patient list
        patient={patient}

      />
    </div>
  );
}

export default CreateEhr;