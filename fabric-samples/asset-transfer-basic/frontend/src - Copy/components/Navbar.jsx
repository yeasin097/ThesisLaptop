import { Link } from 'react-router-dom';

function Navbar({ onPatientList, onCreateEhr }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark shadow-lg fixed-top" style={{ background: 'linear-gradient(90deg, #28a745, #218838)' }}>
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/doctor" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
          Doctor Dashboard
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <button 
                className="nav-link btn text-white fw-medium px-3 py-2"
                onClick={onPatientList}
                style={{ transition: 'all 0.3s' }}
                onMouseEnter={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
              >
                Patient List
              </button>
            </li>
            <li className="nav-item">
              <button 
                className="nav-link btn text-white fw-medium px-3 py-2"
                onClick={onCreateEhr}
                style={{ transition: 'all 0.3s' }}
                onMouseEnter={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
              >
                Create EHR
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;