import { createContext, useState, useContext, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState({ items: [] });
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchCart();
        }
    }, [user]);

    const fetchCart = async () => {
        try {
            const response = await API.get('/cart');
            setCart(response.data);
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    const addToCart = async (productId, quantity, size, color) => {
        try {
            const response = await API.post('/cart', {
                productId,
                quantity,
                size,
                color
            });
            setCart(response.data);
            return response.data;
        } catch (error) {
            console.error('Error adding to cart:', error);
            throw error;
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        try {
            const response = await API.put('/cart/item', { itemId, quantity });
            setCart(response.data);
        } catch (error) {
            console.error('Error updating quantity:', error);
            throw error;
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            const response = await API.delete(`/cart/item/${itemId}`);
            setCart(response.data);
        } catch (error) {
            console.error('Error removing from cart:', error);
            throw error;
        }
    };

    const clearCart = async () => {
        try {
            await API.delete('/cart');
            setCart({ items: [] });
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw error;
        }
    };

    const getTotal = () => {
        return cart.items.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);
    };

    const getItemCount = () => {
        return cart.items.reduce((sum, item) => sum + item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                loading,
                addToCart,
                updateQuantity,
                removeFromCart,
                clearCart,
                getTotal,
                getItemCount,
                fetchCart
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);