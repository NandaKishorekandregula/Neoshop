import { useState, useEffect } from 'react';
import API from '../../utils/api';
import Loading from '../../components/2d/common/Loading';

const CATEGORIES = ['tops', 'bottoms', 'shoes', 'accessories', 'dresses'];

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'tops',
        sizes: '',
        colors: '',
        inventory: '',
        images: [],
    });

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        try {
            const res = await API.get('/products?limit=100');
            setProducts(res.data.products);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const resetForm = () => {
        setFormData({
            name: '', description: '', price: '', category: 'tops',
            sizes: '', colors: '', inventory: '', images: [],
        });
        setEditProduct(null);
        setShowForm(false);
    };

    // Handle image file upload to Cloudinary via your backend
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const uploadData = new FormData();
            files.forEach(file => uploadData.append('images', file));

            const res = await API.post('/upload/multiple', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Add newly uploaded URLs to existing images array
            const newUrls = res.data.images.map(img => img.url);
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newUrls],
            }));
        } catch (err) {
            alert('Image upload failed. Please try again.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    // Remove a specific image from the list
    const handleRemoveImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.images.length === 0) {
            alert('Please upload at least one image.');
            return;
        }

        const payload = {
            ...formData,
            price: parseFloat(formData.price),
            inventory: parseInt(formData.inventory),
            sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
            colors: formData.colors.split(',').map(c => c.trim()).filter(Boolean),
            inStock: parseInt(formData.inventory) > 0,
        };

        try {
            if (editProduct) {
                await API.put(`/products/${editProduct._id}`, payload);
            } else {
                await API.post('/products', payload);
            }
            resetForm();
            fetchProducts();
        } catch (err) {
            alert('Error saving product');
            console.error(err);
        }
    };

    const handleEdit = (product) => {
        setEditProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            sizes: product.sizes.join(', '),
            colors: product.colors.join(', '),
            inventory: product.inventory,
            images: product.images,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await API.delete(`/products/${id}`);
            fetchProducts();
        } catch (err) {
            alert('Error deleting product');
        }
    };

    if (loading) return <Loading />;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Products</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-purple-700 text-white px-5 py-2 rounded-lg hover:bg-purple-800 transition"
                >
                    + Add Product
                </button>
            </div>

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">
                            {editProduct ? 'Edit' : 'Add'} Product
                        </h2>

                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

                            {/* Name */}
                            <div className="col-span-2">
                                <label className="block font-semibold mb-1">Name *</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="col-span-2">
                                <label className="block font-semibold mb-1">Description *</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block font-semibold mb-1">Price (₹) *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500 font-semibold">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block font-semibold mb-1">Category *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sizes */}
                            <div>
                                <label className="block font-semibold mb-1">Sizes (comma-separated)</label>
                                <input
                                    name="sizes"
                                    value={formData.sizes}
                                    onChange={handleChange}
                                    placeholder="S, M, L, XL"
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Colors */}
                            <div>
                                <label className="block font-semibold mb-1">Colors (comma-separated)</label>
                                <input
                                    name="colors"
                                    value={formData.colors}
                                    onChange={handleChange}
                                    placeholder="red, blue, black"
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Inventory */}
                            <div>
                                <label className="block font-semibold mb-1">Inventory *</label>
                                <input
                                    type="number"
                                    name="inventory"
                                    value={formData.inventory}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="col-span-2">
                                <label className="block font-semibold mb-1">
                                    Product Images *
                                    <span className="text-gray-400 font-normal text-sm ml-2">
                                        (upload files or paste a URL below)
                                    </span>
                                </label>

                                {/* File Upload Button */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <p className="text-purple-600 font-semibold">⏳ Uploading...</p>
                                    ) : (
                                        <>
                                            <p className="text-gray-500 text-sm">📁 Click to upload images</p>
                                            <p className="text-gray-400 text-xs mt-1">PNG, JPG, WEBP up to 5MB each</p>
                                        </>
                                    )}
                                </div>

                                {/* OR paste URL */}
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="url"
                                        placeholder="Or paste image URL here and press Enter"
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const url = e.target.value.trim();
                                                if (url) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        images: [...prev.images, url],
                                                    }));
                                                    e.target.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-gray-100 border rounded-lg text-sm hover:bg-gray-200 transition"
                                        onClick={(e) => {
                                            const input = e.target.previousSibling;
                                            const url = input.value.trim();
                                            if (url) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    images: [...prev.images, url],
                                                }));
                                                input.value = '';
                                            }
                                        }}
                                    >
                                        Add URL
                                    </button>
                                </div>

                                {/* Image Previews */}
                                {formData.images.length > 0 && (
                                    <div className="flex gap-3 mt-3 flex-wrap">
                                        {formData.images.map((url, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={url}
                                                    alt={`Product ${index + 1}`}
                                                    className="w-20 h-20 object-cover rounded-lg border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    ✕
                                                </button>
                                                {index === 0 && (
                                                    <span className="absolute bottom-0 left-0 right-0 bg-purple-700 text-white text-xs text-center rounded-b-lg">
                                                        Main
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="col-span-2 flex gap-3 justify-end mt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-2 border-2 rounded-lg hover:border-purple-500 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition disabled:opacity-50"
                                >
                                    {editProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left py-4 px-4">Product</th>
                            <th className="text-left py-4 px-4">Category</th>
                            <th className="text-left py-4 px-4">Price</th>
                            <th className="text-left py-4 px-4">Stock</th>
                            <th className="text-left py-4 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product._id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={product.images[0]}
                                            alt=""
                                            className="w-12 h-12 rounded object-cover"
                                        />
                                        <span className="font-semibold">{product.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 capitalize">{product.category}</td>
                                <td className="py-3 px-4 font-semibold">₹{product.price}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.inStock
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {product.inventory} units
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product._id)}
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {products.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No products yet. Add your first product!
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminProducts;