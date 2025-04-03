import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PatientHome from './pages/PatientHome';
import PatientLogin from './pages/PatientLogin';
import DoctorHome from './pages/DoctorHome';
import ResearcherHome from './pages/ResearcherHome';
import CreateEhr from './pages/CreateEhr';
import DoctorEhrView from './components/DoctorEhrView'

function App() {
  return (
    <div className="min-vh-100">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/patient/home" element={<PatientHome />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/doctor" element={<DoctorHome />} />
        <Route path="/doctor/create-ehr" element={<CreateEhr />} />
        <Route path="/doctor/patient-ehrs" element={<DoctorEhrView />} />
        <Route path="/researcher" element={<ResearcherHome />} />
      </Routes>
    </div>
  );
}

export default App;