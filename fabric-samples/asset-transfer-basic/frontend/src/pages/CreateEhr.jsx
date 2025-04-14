import { useLocation } from 'react-router-dom';
import EhrForm from '../components/EhrForm';

function CreateEhr() {
  const { state } = useLocation();
  const patient = state?.patient;

  return (
    <div className="min-vh-100 bg-light py-5" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold text-teal" style={{ textShadow: '1px 1px 3px rgba(0, 196, 204, 0.2)' }}>Create EHR</h2>
          {patient && (
            <p className="text-muted mt-2" style={{ fontSize: '1.1rem' }}>
              Creating EHR for {patient.name} (NID: {patient.nid_no})
            </p>
          )}
        </div>
        <EhrForm doctorId="d0001" hospitalId="h001" nidNo={patient?.nid_no} patient={patient} />
      </div>
    </div>
  );
}

export default CreateEhr;