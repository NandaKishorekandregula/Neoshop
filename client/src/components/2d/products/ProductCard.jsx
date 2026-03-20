import { Link } from 'react-router-dom';

function ProductCard({ product }) {
    return (
        <Link
            to={`/products/${product._id}`}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group"
        >
            <div className="relative h-64 overflow-hidden bg-gray-100">
                <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                {!product.inStock && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                        Out of Stock
                    </div>
                )}
                <div className="absolute top-2 left-2 bg-primary text-white px-3 py-1 rounded-full text-xs">
                    {product.category}
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary">₹{product.price}</span>
                    <div className="flex items-center">
                        <span className="text-yellow-400">⭐</span>
                        <span className="ml-1 text-sm text-gray-600">{product.rating || 0}</span>
                    </div>
                </div>

                <button className="w-full mt-4 bg-primary text-white py-2 rounded-lg hover:bg-purple-700 transition">
                    View Details
                </button>
            </div>
        </Link>
    );
}

export default ProductCard;