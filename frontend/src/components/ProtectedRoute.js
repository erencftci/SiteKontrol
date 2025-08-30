import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

// Güvenli route bileşeni - sadece giriş yapmış kullanıcılar erişebilir
const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = null }) => {
    const location = useLocation();
    
    // Kullanıcının giriş yapmış olup olmadığını kontrol et
    if (!authService.isAuthenticated()) {
        // Giriş yapmamış kullanıcıyı login sayfasına yönlendir
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Eğer belirli bir rol gerekiyorsa kontrol et
    if (requiredRole) {
        const userRole = authService.getUserRole();
        if (userRole !== requiredRole) {
            // Yetkisiz erişim - dashboard'a yönlendir
            return <Navigate to="/dashboard" replace />;
        }
    }

    // Eğer izin verilen roller listesi verildiyse kontrol et
    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        const userRole = authService.getUserRole();
        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    // Yetkili kullanıcı - içeriği göster
    return children;
};

export default ProtectedRoute; 