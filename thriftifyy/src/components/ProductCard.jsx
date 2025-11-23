import React from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`}>
        <img
          src={product.images?.[0] || "/placeholder.jpg"}
          alt={product.name}
          className="product-img"
        />
        <div className="product-info">
          <h3>{product.name}</h3>
          <p className="price">Rs{product.price}</p>
          <p className="condition">{product.condition}</p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
