/**
 * useAuth.ts
 * Convenience hook — re-exports AuthContext so consumers
 * don't need to import both useContext and AuthContext.
 */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AuthContextValue } from '../types';

const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default useAuth;
