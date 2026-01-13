// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import api from '../../services/api';
// import toast from 'react-hot-toast';
// import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
// import '../../styles/pages/auth.css';

// const ActivateAccount = () => {
//   const { token } = useParams();
//   const navigate = useNavigate();
//   const [status, setStatus] = useState('loading'); // loading, success, error
//   const [message, setMessage] = useState('');



//   const activateAccount = async () => {
//     try {
//       const response = await api.get(`/auth/activate/${token}`);
      
//       // Store token from response
//       if (response.data.token) {
//         localStorage.setItem('token', response.data.token);
//         api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
//       }
      
//       setStatus('success');
//       setMessage('Account activated successfully! Redirecting to dashboard...');
      
//       toast.success('Account activated successfully!');
      
//       // Redirect after 3 seconds
//       setTimeout(() => {
//         navigate('/dashboard');
//       }, 3000);
      
//     } catch (error) {
//       setStatus('error');
//       const errorMsg = error.response?.data?.message || 'Invalid or expired invitation link';
//       setMessage(errorMsg);
//       toast.error(errorMsg);
//     }
//   };
//   useEffect(() => {
//     activateAccount();
//   }, [token]);
//   return (
//     <div className="auth-container">
//       <div className="auth-card activation-card">
//         <div className="activation-icon">
//           {status === 'loading' && <FiLoader className="loading-spinner" />}
//           {status === 'success' && <FiCheckCircle className="success-icon" />}
//           {status === 'error' && <FiXCircle className="error-icon" />}
//         </div>
        
//         <div className="activation-content">
//           <h1>
//             {status === 'loading' && 'Activating Account...'}
//             {status === 'success' && 'Account Activated!'}
//             {status === 'error' && 'Activation Failed'}
//           </h1>
          
//           <p className="activation-message">
//             {message}
//           </p>
          
//           {status === 'loading' && (
//             <div className="loading-progress">
//               <div className="progress-bar">
//                 <div className="progress-fill"></div>
//               </div>
//             </div>
//           )}
          
//           {status === 'success' && (
//             <div className="activation-actions">
//               <p>You will be redirected to the dashboard shortly.</p>
//               <button 
//                 className="auth-btn primary-btn"
//                 onClick={() => navigate('/dashboard')}
//               >
//                 Go to Dashboard Now
//               </button>
//             </div>
//           )}
          
//           {status === 'error' && (
//             <div className="activation-actions">
//               <p>Please contact your administrator for a new invitation.</p>
//               <button 
//                 className="auth-btn secondary-btn"
//                 onClick={() => navigate('/login')}
//               >
//                 Go to Login
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ActivateAccount;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiLoader, FiLock } from 'react-icons/fi';
import '../../styles/pages/auth.css';

const ActivateAccount = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('form'); // form, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setStatus('loading');
    
    try {
      // ✅ POST request with password
      const response = await api.post(`/auth/activate/${token}`, {
        password: password
      });
      
      // Store token from response
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      setStatus('success');
      setMessage('Account activated successfully! Redirecting to dashboard...');
      
      toast.success('Account activated successfully!');
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (error) {
      setStatus('error');
      const errorMsg = error.response?.data?.message || 'Invalid or expired invitation link';
      setMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card activation-card">
        {status === 'form' && (
          <>
            <div className="activation-icon">
              <FiLock size={48} />
            </div>
            
            <div className="activation-content">
              <h1>Set Your Password</h1>
              <p>Create a password to activate your account</p>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 8 characters)"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="auth-btn primary-btn"
                >
                  Activate Account
                </button>
              </form>
            </div>
          </>
        )}
        
        {status !== 'form' && (
          <>
            <div className="activation-icon">
              {status === 'loading' && <FiLoader className="loading-spinner" />}
              {status === 'success' && <FiCheckCircle className="success-icon" />}
              {status === 'error' && <FiXCircle className="error-icon" />}
            </div>
            
            <div className="activation-content">
              <h1>
                {status === 'loading' && 'Activating Account...'}
                {status === 'success' && 'Account Activated!'}
                {status === 'error' && 'Activation Failed'}
              </h1>
              
              <p className="activation-message">
                {message}
              </p>
              
              {status === 'success' && (
                <div className="activation-actions">
                  <p>You will be redirected to the dashboard shortly.</p>
                  <button 
                    className="auth-btn primary-btn"
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to Dashboard Now
                  </button>
                </div>
              )}
              
              {status === 'error' && (
                <div className="activation-actions">
                  <p>Please contact your administrator for a new invitation.</p>
                  <button 
                    className="auth-btn secondary-btn"
                    onClick={() => navigate('/login')}
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivateAccount;