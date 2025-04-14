import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PatientCard({ patient }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleCreateEhr = () => {
    navigate('/doctor/create-ehr', { state: { patient } });
  };

  const handleShowEhrs = () => {
    navigate('/doctor/patient-ehrs', { state: { patient } });
  };

  return (
    <div className="col-12">
      <div
        className="card border-0 shadow-sm rounded-3 mb-3"
        style={{
          backgroundColor: '#fff',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <div
          className="card-header bg-light d-flex justify-content-between align-items-center"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            cursor: 'pointer',
            padding: '15px 20px',
            borderBottom: isExpanded ? '1px solid #e9ecef' : 'none',
          }}
        >
          <h5 className="mb-0 text-primary fw-bold" style={{ fontSize: '1.2rem' }}>
            {patient.name}
          </h5>
          <div className="d-flex align-items-center">
            <span className="text-muted me-3" style={{ fontSize: '1rem' }}>
              NID: {patient.nid_no}
            </span>
            <i
              className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} text-success`}
              style={{ fontSize: '1.2rem' }}
            ></i>
          </div>
        </div>
        {isExpanded && (
          <div
            className="card-body"
            style={{
              padding: '20px',
              minHeight: '250px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <p className="mb-2" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              <strong>Address:</strong> {patient.address || 'N/A'}
            </p>
            <p className="mb-2" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              <strong>Blood Group:</strong> {patient.blood_group || 'N/A'}
            </p>
            <p className="mb-2" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              <strong>Date of Birth:</strong> {patient.date_of_birth || 'N/A'}
            </p>
            <p className="mb-2" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              <strong>Email:</strong> {patient.email || 'N/A'}
            </p>
            <p className="mb-2" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              <strong>Father's Name:</strong> {patient.father_name || 'N/A'}
            </p>
            <p className="mb-2" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              <strong>Gender:</strong> {patient.gender || 'N/A'}
            </p>
            <p
              className="mb-4"
              style={{ fontSize: '1rem', lineHeight: '1.6', wordWrap: 'break-word' }}
            >
              <strong>Phone:</strong> {patient.phone || 'N/A'}
            </p>
            <div className="d-flex justify-content-between">
              <button
                className="btn fw-medium px-4 py-2 rounded-pill"
                onClick={handleCreateEhr}
                style={{
                  backgroundColor: '#007bff',
                  borderColor: '#007bff',
                  color: '#fff',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#0056b3')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#007bff')}
              >
                Create EHR
              </button>
              <button
                className="btn fw-medium px-4 py-2 rounded-pill"
                onClick={handleShowEhrs}
                style={{
                  backgroundColor: '#17a2b8',
                  borderColor: '#17a2b8',
                  color: '#fff',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#117a8b')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#17a2b8')}
              >
                Show EHRs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientCard;