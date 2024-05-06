import React from 'react';

const Footer = () => {
  const footerStyle = {
    backgroundColor: '#f2f2f2',
    padding: '10px',
    textAlign: 'right',
    position: 'fixed',
    bottom: '0',
    width: '100%',
    borderTop: '1px solid #ccc',
    fontSize: '14px',
  };

  const poweredByStyle = {
    color: '#888',
    fontStyle: 'italic',
  };

  return (
    <footer style={footerStyle}>
      <div style={poweredByStyle}>
        Powered By <span style={{ fontWeight: 'bold' }}>Karavya Solutions LLP</span>
      </div>
    </footer>
  );
};

export default Footer;
