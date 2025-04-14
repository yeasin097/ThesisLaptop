import { useState, useEffect } from 'react';
import axios from 'axios';
import PatientList from '../components/PatientList';

function PatientListPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get('http://localhost:8000/patient/all');
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        setPatients(data.map(item => JSON.parse(item)));
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch patient data.');
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (loading) return <div className="min-vh-100 d-flex align-items-center justify-content-center text-success fs-3">Loading...</div>;
  if (error) return <div className="min-vh-100 d-flex align-items-center justify-content-center text-danger fs-3">{error}</div>;

  return (
    <div className="min-vh-100 bg-light py-5" style={{ background: 'linear-gradient(135deg, #e9ecef, #d4edda)' }}>
      <div className="container">
        <h1 className="display-4 text-success fw-bold text-center mb-5" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
          All Patients
        </h1>
        <PatientList patients={patients} />
      </div>
    </div>
  );
}

export default PatientListPage;