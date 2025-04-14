import { useLocation } from 'react-router-dom';
import EhrForm from '../components/EhrForm';

function CreateEhr() {
  const { state } = useLocation();
  const patient = state?.patient;

  return (
    <div className="min-vh-100 bg-light py-5" style={{ background: 'linear-gradient(135deg, #e9ecef, #d4edda)' }}>
      <div className="container">
        <h2 className="display-5 text-success fw-bold text-center mb-5" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
          Create EHR
        </h2>
        {patient && (
          <p className="text-muted text-center mb-4">Creating EHR for {patient.name} (NID: {patient.nid_no})</p>
        )}
        <EhrForm doctorId="d0001" hospitalId="h001" nidNo={patient?.nid_no} patient={patient} />
      </div>
    </div>
  );
}

export default CreateEhr;