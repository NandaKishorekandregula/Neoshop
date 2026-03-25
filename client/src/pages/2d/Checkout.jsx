import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import API from '../../utils/api';

function Checkout() {
    const { cart, getTotal, clearCart } = useCart();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [shippingAddress, setShippingAddress] = useState({
        fullName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        phone: ''
    });

    const handleShippingChange = (e) => {
        setShippingAddress({
            ...shippingAddress,
            [e.target.name]: e.target.value
        });
    };

    const validateShipping = () => {
        const required = ['fullName', 'addressLine1', 'city', 'state', 'zipCode', 'phone'];
        for (let field of required) {
            if (!shippingAddress[field]) {
                setError(`Please fill in ${field}`);
                return false;
            }
        }
        return true;
    };

    const handleNextStep = () => {
        if (step === 1 && validateShipping()) {
            setError('');
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        }
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        setError('');

        try {
            const orderData = {
                items: cart.items.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    price: item.product.price,
                    size: item.size,
                    color: item.color
                })),
                shippingAddress,
                totalAmount: getTotal() * 1.1 // Including tax
            };

            const response = await API.post('/orders', orderData);

            await clearCart();
            navigate(`/order-success/${response.data._id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">Checkout</h1>

            {/* Progress Steps */}
            <div className="flex justify-center mb-12">
                <div className="flex items-center">
                    <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-primary bg-primary text-white' : 'border-gray-400'
                            }`}>
                            1
                        </div>
                        <span className="ml-2 font-semibold">Shipping</span>
                    </div>

                    <div className={`w-20 h-1 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>

                    <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-primary bg-primary text-white' : 'border-gray-400'
                            }`}>
                            2
                        </div>
                        <span className="ml-2 font-semibold">Payment</span>
                    </div>

                    <div className={`w-20 h-1 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-gray-300'}`}></div>

                    <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-primary bg-primary text-white' : 'border-gray-400'
                            }`}>
                            3
                        </div>
                        <span className="ml-2 font-semibold">Review</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-md p-8">
                        {/* Step 1: Shipping Address */}
                        {step === 1 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block font-semibold mb-2">Full Name *</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={shippingAddress.fullName}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block font-semibold mb-2">Address Line 1 *</label>
                                        <input
                                            type="text"
                                            name="addressLine1"
                                            value={shippingAddress.addressLine1}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block font-semibold mb-2">Address Line 2</label>
                                        <input
                                            type="text"
                                            name="addressLine2"
                                            value={shippingAddress.addressLine2}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold mb-2">City *</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={shippingAddress.city}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold mb-2">State *</label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={shippingAddress.state}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold mb-2">Zip Code *</label>
                                        <input
                                            type="text"
                                            name="zipCode"
                                            value={shippingAddress.zipCode}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold mb-2">Phone *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={shippingAddress.phone}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Payment */}
                        {step === 2 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

                                <div className="space-y-4">
                                    <div className="border-2 border-primary rounded-lg p-4 cursor-pointer">
                                        <div className="flex items-center">
                                            <input type="radio" checked readOnly className="mr-3" />
                                            <div>
                                                <p className="font-semibold">💳 Credit/Debit Card</p>
                                                <p className="text-sm text-gray-600">Pay securely with your card</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border rounded-lg p-4 opacity-50 cursor-not-allowed">
                                        <div className="flex items-center">
                                            <input type="radio" disabled className="mr-3" />
                                            <div>
                                                <p className="font-semibold">📱 UPI</p>
                                                <p className="text-sm text-gray-600">Coming soon</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border rounded-lg p-4 opacity-50 cursor-not-allowed">
                                        <div className="flex items-center">
                                            <input type="radio" disabled className="mr-3" />
                                            <div>
                                                <p className="font-semibold">🏦 Net Banking</p>
                                                <p className="text-sm text-gray-600">Coming soon</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        💡 <strong>Demo Mode:</strong> No actual payment will be processed.
                                        Click "Continue" to simulate payment.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review Order */}
                        {step === 3 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Review Order</h2>

                                {/* Shipping Address Review */}
                                <div className="mb-6">
                                    <h3 className="font-semibold text-lg mb-3">Shipping Address</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="font-semibold">{shippingAddress.fullName}</p>
                                        <p>{shippingAddress.addressLine1}</p>
                                        {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                                        <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                                        <p>{shippingAddress.phone}</p>
                                    </div>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-primary hover:underline mt-2"
                                    >
                                        Edit Address
                                    </button>
                                </div>

                                {/* Order Items */}
                                <div className="mb-6">
                                    <h3 className="font-semibold text-lg mb-3">Order Items</h3>
                                    <div className="space-y-4">
                                        {cart.items.map((item) => (
                                            <div key={item._id} className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
                                                <img
                                                    src={item.product.images[0]}
                                                    alt={item.product.name}
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{item.product.name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Qty: {item.quantity} | Size: {item.size} | Color: {item.color}
                                                    </p>
                                                </div>
                                                <p className="font-bold">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8">
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-primary transition"
                                >
                                    ← Back
                                </button>
                            )}

                            {step < 3 ? (
                                <button
                                    onClick={handleNextStep}
                                    className="ml-auto px-6 py-3 bg-primary text-white rounded-lg hover:bg-purple-700 transition"
                                >
                                    Continue →
                                </button>
                            ) : (
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className="ml-auto px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : '🎉 Place Order'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                        <h3 className="text-xl font-bold mb-4">Order Summary</h3>

                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold">₹{getTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-semibold text-green-600">FREE</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax (10%)</span>
                                <span className="font-semibold">₹{(getTotal() * 0.1).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between text-xl font-bold">
                                <span>Total</span>
                                <span className="text-primary">₹{(getTotal() * 1.1).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Checkout;