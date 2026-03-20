import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import SpatialNavbar from './SpatialNavbar';

export default function Global3DOverlay({ is3DMode }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { getItemCount } = useCart();
    const cartItemsCount = user ? getItemCount() : 0;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col justify-between">
            {/* --- THE 3D SPATIAL NAVBAR --- */}
            <div className="w-full h-32 absolute top-0 left-0">
                {is3DMode && (
                    <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
                        <SpatialNavbar 
                            navigate={navigate} 
                            user={user} 
                            logout={logout} 
                            cartItemsCount={cartItemsCount} 
                        />
                    </Canvas>
                )}
            </div>
            {/* 🌟 The toggle switch has been removed from here! */}
        </div>
    );
}