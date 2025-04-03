import { useState, useEffect } from 'react';
import axios from 'axios';
import PatientCard from './PatientCard';

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get('http://localhost:8000/patient/all');
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const patientList = data.map(item => JSON.parse(item));
        setPatients(patientList);
        setFilteredPatients(patientList);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch patient data.');
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(
      patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.nid_no.includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Patient List</h2>
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name or NID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="row">
        {filteredPatients.map((patient, index) => (
          <PatientCard key={index} patient={patient} />
        ))}
      </div>
    </div>
  );
}

export default PatientList;