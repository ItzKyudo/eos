import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    role?: 'admin' | 'user';
}

const ProtectedRoute = ({ role }: ProtectedRouteProps) => {
    const token = sessionStorage.getItem('token');
    const userString = sessionStorage.getItem('user');
    let user = null;

    try {
        user = userString ? JSON.parse(userString) : null;
    } catch (e) {
        console.error("Error parsing user from local storage", e);
    }

    if (!token || !user) {
        return <Navigate to="/" replace />;
    }

    if (role && user.role !== role) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
