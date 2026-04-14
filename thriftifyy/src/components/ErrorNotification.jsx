import React, { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import '../index.css';

/**
 * Reusable ErrorNotification component for displaying error/success/info messages
 * Replaces alert() and console.error throughout the application
 * 
 * Props:
 * - message (string): The error/success message to display
 * - type (string): 'error', 'success', 'info', 'warning' (default: 'error')
 * - onClose (function): Callback when message should be dismissed
 * - autoClose (boolean): Auto-close after 5 seconds (default: true)
 * - dismissible (boolean): Show dismiss button (default: true)
 * - showIcon (boolean): Show icon based on type (default: true)
 */
const ErrorNotification = ({ 
  message, 
  type = 'error', 
  onClose, 
  autoClose = true, 
  dismissible = true,
  showIcon = true 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);

    if (autoClose && type !== 'error') {
      // Auto-close success/info after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    } else if (autoClose && type === 'error') {
      // Auto-close error after 7 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [message, autoClose, type]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!message || !visible) {
    return null;
  }

  const variantMap = {
    error: 'danger',
    success: 'success',
    info: 'info',
    warning: 'warning'
  };

  const iconMap = {
    error: '❌',
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️'
  };

  const variant = variantMap[type] || 'danger';
  const icon = iconMap[type] || '❌';

  const alertStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    borderRadius: '8px',
    padding: '12px 16px',
    animation: 'slideDown 0.3s ease-in-out',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    wordBreak: 'break-word',
    maxWidth: '100%'
  };

  const iconStyle = {
    fontSize: '20px',
    minWidth: '20px',
    flexShrink: 0
  };

  const messageStyle = {
    flex: 1,
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.4'
  };

  return (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      <Alert 
        variant={variant}
        onClose={dismissible ? handleClose : undefined}
        dismissible={dismissible}
        style={alertStyle}
        className="error-notification"
      >
        {showIcon && <span style={iconStyle}>{icon}</span>}
        <div style={messageStyle}>
          {message}
        </div>
      </Alert>
    </div>
  );
};

export default ErrorNotification;
