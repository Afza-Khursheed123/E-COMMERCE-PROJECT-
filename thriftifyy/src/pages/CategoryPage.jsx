import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

function CategoryPage() {
  const { categoryName } = useParams();
  const [data, setData] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // active filters
  const [sortOption, setSortOption] = useState("featured");
  const [conditionFilter, setConditionFilter] = useState("all");

  // fetch category data
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/category/${categoryName}`);
        setData(res.data);
        setFiltered(res.data.results || []);
      } catch (error) {
        console.error("    Category fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryData();
  }, [categoryName]);

  // apply filters and sorting
  useEffect(() => {
    if (!data?.results) return;

    let updated = [...data.results];

    // filter by condition
    if (conditionFilter !== "all") {
      updated = updated.filter(
        (p) => p.condition.toLowerCase() === conditionFilter.toLowerCase()
      );
    }

    // sort options
    if (sortOption === "lowToHigh") {
      updated.sort((a, b) => a.price - b.price);
    } else if (sortOption === "highToLow") {
      updated.sort((a, b) => b.price - a.price);
    } else if (sortOption === "featured") {
      // optional: sort by discount or createdAt
      updated.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    }

    setFiltered(updated);
  }, [sortOption, conditionFilter, data]);

  if (loading) return <p className="text-center mt-10">Loading {categoryName}...</p>;
  if (!data) return <p className="text-center mt-10 text-red-600">No data found.</p>;

  return (
    <div className="px-8 py-10 bg-white min-h-screen">
      {/* ===== Header ===== */}
      <h2 className="text-3xl font-bold mb-6 text-blue-950">
        {data.category.charAt(0).toUpperCase() + data.category.slice(1)} Products
      </h2>

      {/* ===== Filters & Sort ===== */}
      <div className="flex flex-wrap items-center justify-between bg-blue-950 rounded-xl p-4 mb-8 text-white">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="font-semibold">Sort By:</span>
          <button
            className={`px-3 py-1 rounded-md ${
              sortOption === "featured" ? "bg-white text-blue-900 font-semibold" : "hover:text-yellow-300"
            }`}
            onClick={() => setSortOption("featured")}
          >
            Featured
          </button>
          <button
            className={`px-3 py-1 rounded-md ${
              sortOption === "lowToHigh" ? "bg-white text-blue-900 font-semibold" : "hover:text-yellow-300"
            }`}
            onClick={() => setSortOption("lowToHigh")}
          >
            Price: Low to High
          </button>
          <button
            className={`px-3 py-1 rounded-md ${
              sortOption === "highToLow" ? "bg-white text-blue-900 font-semibold" : "hover:text-yellow-300"
            }`}
            onClick={() => setSortOption("highToLow")}
          >
            Price: High to Low
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <span className="font-semibold">Condition:</span>
          {["all", "New", "Like New", "Used"].map((cond) => (
            <button
              key={cond}
              className={`px-3 py-1 rounded-md ${
                conditionFilter === cond.toLowerCase()
                  ? "bg-white text-blue-900 font-semibold"
                  : "hover:text-yellow-300"
              }`}
              onClick={() => setConditionFilter(cond.toLowerCase())}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Products Grid ===== */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-all"
            >
              <Link to={`/products/${item._id}`}>
                <img
                  src={item.images?.[0] || "/placeholder.jpg"}
                  alt={item.name}
                  className="w-full h-52 object-cover"
                />
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-1 truncate">
                    {item.name}
                  </h4>
                  <p className="text-green-700 font-bold mb-1">${item.price}</p>
                  <p className="text-gray-500 text-sm">{item.condition}</p>
                  {item.discount && (
                    <p className="text-sm text-red-500 font-medium">
                      {item.discount}% OFF
                    </p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-8">
          No products match the selected filters.
        </p>
      )}
    </div>
  );
}

export default CategoryPage;
