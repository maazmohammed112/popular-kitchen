import { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const showSuccess = (message) => toast.success(message, {
    style: {
      background: '#152847', // pk-surface
      color: '#00C896', // pk-success
      border: '1px solid #00C896'
    },
    iconTheme: {
      primary: '#00C896',
      secondary: '#152847',
    },
  });

  const showError = (message) => toast.error(message, {
    style: {
      background: '#152847',
      color: '#FF4757', // pk-error
      border: '1px solid #FF4757'
    },
    iconTheme: {
      primary: '#FF4757',
      secondary: '#152847',
    },
  });

  const showInfo = (message) => toast(message, {
    style: {
      background: '#152847',
      color: '#1E90FF', // pk-accent
      border: '1px solid #1E90FF'
    },
    icon: 'ℹ️',
  });

  const value = {
    showSuccess,
    showError,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster position="bottom-center" reverseOrder={false} />
    </ToastContext.Provider>
  );
};
