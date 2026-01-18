import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { ToastContainer } from './Toast';

const Notification = () => {
    const { toasts, removeToast } = useAppContext();

    return <ToastContainer toasts={toasts} onClose={removeToast} />;
};

export default Notification;
