import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../utils/api';
// 🌟 FIX: Import your new 3D Product Card instead of the 2D one
import ProductCard3D from '../../components/3d/ProductCard3D';
import Loading from '../../components/common/Loading';

export default function Products3D() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        color: searchParams.get('color') || '',
        sort: searchParams.get('sort') || ''
    });
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchProducts();
    }, [filters, currentPage]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) params.append(key, filters[key]);
            });
            params.append('page', currentPage);
            params.append('limit', 12);

            const response = await API.get(`/products?${params}`);
            setProducts(response.data.products);
            setTotalPages(response.data.pages);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
        setCurrentPage(1);

        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            category: '',
            minPrice: '',
            maxPrice: '',
            color: '',
            sort: ''
        });
        setSearchParams({});
    };

    return (
        // 🌟 pt-40 ensures the catalog starts BELOW your floating Spatial Navbar!
        // The background matches the soft #F8F9FE of the 3D landing page.
        <div className="w-full min-h-screen bg-[#F8F9FE] pt-40 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
            
            <div className="container mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
                        The <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Collection.</span>
                    </h1>
                </div>

                <div className="grid lg:grid-cols-4 gap-12">
                    
                    {/* Filters Sidebar (Updated for a premium 3D Studio look) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-white sticky top-40">
                            <h2 className="text-2xl font-black mb-6 text-gray-800 tracking-tight">Filters</h2>

                            {/* Search */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Search</label>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                                />
                            </div>

                            {/* Category */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none transition-all cursor-pointer"
                                >
                                    <option value="">All Categories</option>
                                    <option value="tops">Tops</option>
                                    <option value="bottoms">Bottoms</option>
                                    <option value="shoes">Shoes</option>
                                    <option value="accessories">Accessories</option>
                                    <option value="dresses">Dresses</option>
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Price Range</label>
                                <div className="flex gap-3">
                                    <input
                                        type="number"
                                        value={filters.minPrice}
                                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                        placeholder="Min"
                                        className="w-1/2 px-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                                    />
                                    <input
                                        type="number"
                                        value={filters.maxPrice}
                                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                        placeholder="Max"
                                        className="w-1/2 px-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Sort */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sort By</label>
                                <select
                                    value={filters.sort}
                                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none transition-all cursor-pointer"
                                >
                                    <option value="">Default</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="name">Name: A-Z</option>
                                    <option value="newest">Newest First</option>
                                </select>
                            </div>

                            <button
                                onClick={clearFilters}
                                className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] transition-all duration-300"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <div className="h-[60vh] flex items-center justify-center">
                                <Loading />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-20 bg-white/50 rounded-[40px] border border-white">
                                <span className="text-6xl block mb-4">📭</span>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Nothing found</h3>
                                <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                            </div>
                        ) : (
                            <>
                                {/* 🌟 FIX: Massive gap-y-24 so the pop-out images don't clip into the row above them! */}
                                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-24 mt-12">
                                    {products.map(product => (
                                        <ProductCard3D key={product._id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-4 mt-24">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-6 py-3 bg-white border border-gray-100 font-bold rounded-full shadow-sm hover:shadow-md disabled:opacity-50 disabled:pointer-events-none transition-all"
                                        >
                                            Previous
                                        </button>
                                        <span className="font-black text-gray-400 tracking-widest">
                                            {currentPage} <span className="text-gray-300 font-normal mx-1">/</span> {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-6 py-3 bg-white border border-gray-100 font-bold rounded-full shadow-sm hover:shadow-md disabled:opacity-50 disabled:pointer-events-none transition-all"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}