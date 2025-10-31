import React from "react";
import { Link } from "react-router-dom";

const CategoryCard = ({ category }) => {
  return (
    <Link to={`/category/${category.name}`} className="category-card">
      <img src={category.image || "/placeholder.jpg"} alt={category.name} />
      <div className="category-info">
        <h3>{category.name}</h3>
        <p>{category.itemsCount || "View Items"}</p>
      </div>
    </Link>
  );
};

export default CategoryCard;
