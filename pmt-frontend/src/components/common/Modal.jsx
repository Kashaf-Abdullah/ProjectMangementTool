import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import '../../styles/components/modals.css';

const Modal = ({ isOpen, onClose, title, children, size = 'medium', showClose = true }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`modal-container ${size}`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {showClose && (
            <button className="modal-close" onClick={onClose}>
              <FiX size={20} />
            </button>
          )}
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;