import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [nidNo, setNidNo] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  return (
    <div className="container d-flex flex-column justify-content-center min-vh-100">
      <h1 className="text-center mb-5">Healthcare System</h1>
      <div className="row justify-content-center">
        {/* Patient Login */}
        
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Login as Patient</h5>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/patient/login')}
              >
                Login with Patient
              </button>
            </div>
          </div>
        </div>

        {/* Doctor Login */}
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Login as Doctor</h5>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/doctor')}
              >
                Go to Doctor Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Researcher Login */}
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Login as Researcher</h5>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/researcher')}
              >
                Go to Researcher Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;