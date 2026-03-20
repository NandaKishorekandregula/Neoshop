import { Link } from 'react-router-dom';

export default function ProductCard3D({ product }) {
    // 🌟 The official NeoShop brand gradient
    const neoGradient = 'bg-gradient-to-r from-purple-600 to-pink-500';
    // 🌟 Applying that exact gradient directly to the text!
    const textGradient = 'bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500';

    return (
        <div style={{ perspective: '1200px' }} className="w-full max-w-[280px] mx-auto">
            <Link
                to={`/products/${product._id}`}
                // Removed the dark shadows and made the card a crisp, clean white 
                className="relative flex flex-col w-full bg-white rounded-[32px] overflow-visible transition-all duration-500 group border border-gray-50"
                style={{
                    minHeight: '420px',
                    transform: 'rotateY(-15deg) rotateX(10deg) translateZ(0)',
                    transformStyle: 'preserve-3d',
                    boxShadow: '20px 20px 40px rgba(0,0,0,0.06)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(30px)';
                    e.currentTarget.style.boxShadow = '0px 30px 50px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'rotateY(-15deg) rotateX(10deg) translateZ(0)';
                    e.currentTarget.style.boxShadow = '20px 20px 40px rgba(0,0,0,0.06)';
                }}
            >
                {/* 🌟 Removed the large background curve! The card is now pure white. */}

                {/* --- TOP CONTENT --- */}
                <div className="relative z-10 px-6 pt-8 pb-2" style={{ transform: 'translateZ(20px)' }}>
                    {/* 🌟 The Product Name is now colored with the beautiful gradient! */}
                    <h2 className={`text-2xl font-black leading-tight drop-shadow-sm line-clamp-2 ${textGradient}`}>
                        {product.name}
                    </h2>
                    {/* Updated the pill to be a soft purple so it matches the text */}
                    <span className="inline-block mt-3 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-100">
                        {product.category}
                    </span>
                </div>

                {/* --- THE TRUE 3D POP-OUT IMAGE --- */}
                <div
                    className="relative z-20 h-[180px] w-full flex items-center justify-center pointer-events-none mt-[-10px]"
                    style={{ transform: 'translateZ(60px)' }}
                >
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        // Softened the drop shadow slightly so it looks better against a white background
                        className="w-[120%] h-[130%] object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.25)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
                    />
                </div>

                {/* --- BOTTOM DETAILS --- */}
                <div className="relative z-10 px-6 pb-6 mt-auto flex flex-col gap-4" style={{ transform: 'translateZ(20px)' }}>

                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Product Details</p>
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{product.description}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Status: <span className={product.inStock ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>{product.inStock ? 'Available' : 'Sold Out'}</span></p>
                    </div>

                    <button
                        // 🌟 The button matches the text gradient perfectly
                        className={`w-full flex justify-between items-center ${neoGradient} text-white font-bold py-3.5 px-5 rounded-full shadow-[0_10px_20px_rgba(168,85,247,0.2)] transition-transform duration-300 transform active:scale-95`}
                        onClick={(e) => {
                            // e.preventDefault(); 
                        }}
                    >
                        <span className="text-sm tracking-wide">Add to Cart</span>
                        <span className="text-lg">₹{product.price}</span>
                    </button>
                </div>

            </Link>
        </div>
    );
}