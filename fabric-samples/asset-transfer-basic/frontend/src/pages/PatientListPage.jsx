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

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;

  return (
    <div className="container py-5">
      <h1 className="text-center mb-4">All Patients</h1>
      <PatientList patients={patients} />
    </div>
  );
}

export default PatientListPage;