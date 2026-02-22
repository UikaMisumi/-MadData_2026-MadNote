import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <div className="navbar">
      <h2>MadNote</h2>
      <nav>
        <Link to="/feed">Home</Link>
        <Link to="/about-us">About Us</Link>
        <Link to="/other-info">Other Info</Link>
      </nav>
    </div>
  );
}

export default Navbar;
