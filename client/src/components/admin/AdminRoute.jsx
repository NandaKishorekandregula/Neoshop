import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';

function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <Loading />;

    if (!user || user.role !== 'admin') {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default AdminRoute;