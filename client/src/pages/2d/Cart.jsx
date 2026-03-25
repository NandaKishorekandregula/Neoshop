import { useCart } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import Loading from '../../components/2d/common/Loading';

function Cart() {
    const { cart, loading, updateQuantity, removeFromCart, getTotal } = useCart();
    const navigate = useNavigate();

    if (loading) return <Loading />;

    if (cart.items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-3xl font-bold mb-4">Your Cart is Empty</h2>
                <p className="text-gray-600 mb-8">Add some products to get started!</p>
                <Link
                    to="/products"
                    className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition inline-block"
                >
                    Shop Now
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        {cart.items.map((item) => (
                            <div key={item._id} className="flex gap-4 py-6 border-b last:border-b-0">
                                {/* Product Image */}
                                <Link to={`/products/${item.product._id}`} className="flex-shrink-0">
                                    <img
                                        src={item.product.images[0]}
                                        alt={item.product.name}
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                </Link>

                                {/* Product Info */}
                                <div className="flex-grow">
                                    <Link
                                        to={`/products/${item.product._id}`}
                                        className="font-semibold text-lg hover:text-primary"
                                    >
                                        {item.product.name}
                                    </Link>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Size: {item.size} | Color: {item.color}
                                    </p>
                                    <p className="text-primary font-bold text-xl mt-2">
                                        ₹{item.product.price}
                                    </p>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex flex-col items-end justify-between">
                                    <button
                                        onClick={() => removeFromCart(item._id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        🗑️ Remove
                                    </button>

                                    <div className="flex items-center gap-2 mt-4">
                                        <button
                                            onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                                            className="w-8 h-8 border rounded hover:bg-gray-100"
                                        >
                                            -
                                        </button>
                                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                            className="w-8 h-8 border rounded hover:bg-gray-100"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <p className="font-bold text-lg mt-2">
                                        ₹{(item.product.price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                        <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold">${getTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-semibold">$0.00</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax</span>
                                <span className="font-semibold">${(getTotal() * 0.1).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="border-t pt-4 mb-6">
                            <div className="flex justify-between text-xl font-bold">
                                <span>Total</span>
                                <span className="text-primary">${(getTotal() * 1.1).toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/checkout')}
                            className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-lg font-semibold hover:shadow-lg transition mb-3"
                        >
                            Proceed to Checkout
                        </button>

                        <Link
                            to="/products"
                            className="block text-center text-primary hover:underline"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Cart;