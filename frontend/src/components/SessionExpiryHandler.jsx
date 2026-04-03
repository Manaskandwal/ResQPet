import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SessionExpiryHandler = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleSessionExpired = () => {
            navigate('/login', { replace: true, state: { expired: true } });
        };

        window.addEventListener('auth:session-expired', handleSessionExpired);
        return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
    }, [navigate]);

    return null;
};

export default SessionExpiryHandler;
