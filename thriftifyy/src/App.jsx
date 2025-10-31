// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import AdminHomePage from "./pages/AdminHomePage.jsx";
import HomePage from "./pages/SellerHomePage.jsx";
import BuyerHomePage from "./pages/BuyerHomePage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
        <Route path="/adminhomepage" element={<AdminHomePage />} />
      <Route path="/sellerhomepage" element={<HomePage />} />
      <Route path="/buyerhomepage" element={<BuyerHomePage />} />
      {/* <Route path="/category/:id" element={<CategoryPage />} /> */}
<Route path="/category/:categoryName" element={<CategoryPage />} />
        <Route path="/products/:id" element={<ProductPage />} />
    </Routes>
  );
}

export default App;