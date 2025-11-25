import React from 'react';

const SearchBar = ({ value, onChange, placeholder, style }) => {
  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder || 'Search...'}
        style={{
          width: '100%',
          padding: '12px 16px 12px 44px',
          borderRadius: '12px',
          border: '2px solid rgba(0,0,0,0.06)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          transition: 'all 0.25s ease',
          fontSize: '1rem',
          outline: 'none',
          background: '#fff'
        }}
      />
      <i className="fa-solid fa-magnifying-glass" style={{
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'rgba(0,0,0,0.35)',
        fontSize: '1.1rem'
      }} />
    </div>
  );
};

export default SearchBar;
