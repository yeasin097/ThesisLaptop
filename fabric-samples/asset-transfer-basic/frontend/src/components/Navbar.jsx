import { Link } from 'react-router-dom';

function Navbar({ onPatientList, onCreateEhr }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/doctor">Doctor Dashboard</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <button className="nav-link btn" onClick={onPatientList}>
                Patient List
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn" onClick={onCreateEhr}>
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