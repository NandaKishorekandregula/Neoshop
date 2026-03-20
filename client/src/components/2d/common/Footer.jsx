import { Link } from 'react-router-dom';

function Footer() {
    return (
        <footer className="bg-gray-900 text-white mt-20">
            <div className="container mx-auto px-4 py-12">
                <div className="grid md:grid-cols-4 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-xl font-bold mb-4">🛍️ NeoShop</h3>
                        <p className="text-gray-400">
                            Experience the future of online shopping with AI-powered outfit coordination and 3D product visualization.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li><Link to="/products" className="text-gray-400 hover:text-white">Products</Link></li>
                            <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                            <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h4 className="font-semibold mb-4">Categories</h4>
                        <ul className="space-y-2">
                            <li><Link to="/products?category=tops" className="text-gray-400 hover:text-white">Tops</Link></li>
                            <li><Link to="/products?category=bottoms" className="text-gray-400 hover:text-white">Bottoms</Link></li>
                            <li><Link to="/products?category=shoes" className="text-gray-400 hover:text-white">Shoes</Link></li>
                            <li><Link to="/products?category=accessories" className="text-gray-400 hover:text-white">Accessories</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold mb-4">Contact Us</h4>
                        <p className="text-gray-400 mb-2">📧 support@neoshop.com</p>
                        <p className="text-gray-400 mb-4">📞 +1 (555) 123-4567</p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-white">📘</a>
                            <a href="#" className="text-gray-400 hover:text-white">🐦</a>
                            <a href="#" className="text-gray-400 hover:text-white">📷</a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                    <p>&copy; 2025 NeoShop. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;