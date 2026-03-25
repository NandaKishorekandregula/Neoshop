import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../utils/api';
import ProductCard from '../../components/2d/products/ProductCard';
import Loading from '../../components/2d/common/Loading';

function Products() {
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
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">Products</h1>

            <div className="grid md:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-md sticky top-20">
                        <h2 className="text-xl font-bold mb-4">Filters</h2>

                        {/* Search */}
                        <div className="mb-4">
                            <label className="block font-semibold mb-2">Search</label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="Search products..."
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>

                        {/* Category */}
                        <div className="mb-4">
                            <label className="block font-semibold mb-2">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
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
                        <div className="mb-4">
                            <label className="block font-semibold mb-2">Price Range</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={filters.minPrice}
                                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                    placeholder="Min"
                                    className="w-1/2 px-3 py-2 border rounded-lg"
                                />
                                <input
                                    type="number"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                    placeholder="Max"
                                    className="w-1/2 px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="mb-4">
                            <label className="block font-semibold mb-2">Sort By</label>
                            <select
                                value={filters.sort}
                                onChange={(e) => handleFilterChange('sort', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
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
                            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="md:col-span-3">
                    {loading ? (
                        <Loading />
                    ) : products.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-xl text-gray-600">No products found</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-3 gap-6">
                                {products.map(product => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2 mt-8">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 border rounded-lg disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-4 py-2">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 border rounded-lg disabled:opacity-50"
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
    );
}

export default Products;