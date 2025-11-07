// App.jsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import AdminLayout from "./admin/Admin.jsx"; // your admin panel component
import StripePayment from "./pages/StripePayment.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin/*" element={<AdminLayout />} />
      <Route path="/stripe" element={<StripePayment />} />
    </Routes>
  );
}

export default App;
