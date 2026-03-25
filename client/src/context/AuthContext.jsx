import { createContext, useState, useContext, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUserState] = useState(null);
    const [loading, setLoading] = useState(true);

    // On app load — fetch fresh user from DB so profilePhoto is always current
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            API.get('/auth/me')
                .then(res => {
                    setUserState(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUserState(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // Updates both state AND localStorage together
    const setUser = (updatedUser) => {
        setUserState(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const register = async (name, email, password) => {
        const response = await API.post('/auth/register', { name, email, password });
        localStorage.setItem('token', response.data.token);
        // ✅ Fetch fresh user from DB after register so all fields including profilePhoto are included
        const freshUser = await API.get('/auth/me');
        setUserState(freshUser.data);
        localStorage.setItem('user', JSON.stringify(freshUser.data));
        return response.data;
    };

    const login = async (email, password) => {
        const response = await API.post('/auth/login', { email, password });
        localStorage.setItem('token', response.data.token);
        // ✅ Fetch fresh user from DB after login so profilePhoto is always included
        const freshUser = await API.get('/auth/me');
        setUserState(freshUser.data);
        localStorage.setItem('user', JSON.stringify(freshUser.data));
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUserState(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);