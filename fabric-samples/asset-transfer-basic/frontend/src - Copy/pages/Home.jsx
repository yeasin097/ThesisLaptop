import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5" style={{ background: 'linear-gradient(135deg, #f0f4ff, #e6f0fa)' }}>
      <div className="container">
        <h1 className="display-4 text-center text-dark mb-5 fw-bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
        Blockchain Based EHR system with NID
        </h1>
        <div className="row justify-content-center g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow h-100 transition-all" style={{ transition: 'all 0.3s' }}>
              <div className="card-body text-center p-4">
                <h5 className="card-title text-primary fw-semibold mb-3">Patient Portal</h5>
                <button
                  className="btn btn-primary w-100 py-2 fw-medium"
                  onClick={() => navigate('/patient/login')}
                  style={{ backgroundColor: '#007bff', borderColor: '#007bff', transition: 'all 0.3s' }}
                  onMouseEnter={e => e.target.style.backgroundColor = '#0056b3'}
                  onMouseLeave={e => e.target.style.backgroundColor = '#007bff'}
                >
                  Access Dashboard
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow h-100 transition-all" style={{ transition: 'all 0.3s' }}>
              <div className="card-body text-center p-4">
                <h5 className="card-title text-success fw-semibold mb-3">Doctor Portal</h5>
                <button
                  className="btn btn-success w-100 py-2 fw-medium"
                  onClick={() => navigate('/doctor')}
                  style={{ backgroundColor: '#28a745', borderColor: '#28a745', transition: 'all 0.3s' }}
                  onMouseEnter={e => e.target.style.backgroundColor = '#218838'}
                  onMouseLeave={e => e.target.style.backgroundColor = '#28a745'}
                >
                  Doctor Dashboard
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow h-100 transition-all" style={{ transition: 'all 0.3s' }}>
              <div className="card-body text-center p-4">
                <h5 className="card-title text-purple fw-semibold mb-3" style={{ color: '#6f42c1' }}>Research Portal</h5>
                <button
                  className="btn w-100 py-2 fw-medium"
                  onClick={() => navigate('/researcher')}
                  style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1', color: '#fff', transition: 'all 0.3s' }}
                  onMouseEnter={e => e.target.style.backgroundColor = '#5a32a3'}
                  onMouseLeave={e => e.target.style.backgroundColor = '#6f42c1'}
                >
                  Research Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;