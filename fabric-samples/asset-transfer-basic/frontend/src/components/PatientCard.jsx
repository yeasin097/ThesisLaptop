import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PatientCard({ patient }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreateEhr = () => {
    navigate('/doctor/create-ehr', { state: { patient } });
  };

  const handleShowEhrs = () => {
    navigate('/doctor/patient-ehrs', { state: { patient } });
  };

  return (
    <div className="col-md-6 mb-3">
      <div className="card">
        <div
          className="card-header d-flex justify-content-between align-items-center"
          onClick={() => setIsOpen(!isOpen)}
          style={{ cursor: 'pointer' }}
        >
          <h5 className="mb-0">{patient.name}</h5>
          <span>NID: {patient.nid_no}</span>
        </div>
        {isOpen && (
          <div className="card-body">
            <p><strong>Address:</strong> {patient.address}</p>
            <p><strong>Blood Group:</strong> {patient.blood_group}</p>
            <p><strong>Date of Birth:</strong> {patient.date_of_birth}</p>
            <p><strong>Email:</strong> {patient.email}</p>
            <p><strong>Father's Name:</strong> {patient.father_name}</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
            <p><strong>Phone:</strong> {patient.phone}</p>
            <button className="btn btn-primary mt-2 me-2" onClick={handleCreateEhr}>
              Create EHR
            </button>
            <button className="btn btn-info mt-2" onClick={handleShowEhrs}>
              Show Previous EHRs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientCard;