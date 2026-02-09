import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';

interface DecodedToken {
    exp: number;
}

const SessionTimeout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const verifyToken = async () => {
            try {
                await api.get('/profile');
            } catch (e) {
                // Error handled by interceptor
            }
        };

        const checkTokenExpiration = () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            verifyToken();

            try {
                const decoded: DecodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decoded.exp < currentTime) {
                    // Token expired
                    handleLogout();
                } else {
                    // Set a timeout to log out when the token expires
                    const timeRemaining = (decoded.exp - currentTime) * 1000;
                    const timeoutId = setTimeout(handleLogout, timeRemaining);
                    return () => clearTimeout(timeoutId);
                }
            } catch (error) {
                console.error('Invalid token:', error);
                handleLogout();
            }
        };

        const handleLogout = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/');
        };

        const cleanup = checkTokenExpiration();
        return cleanup; // Cleanup timer if set
    }, [navigate]);

    return null;
};

export default SessionTimeout;
