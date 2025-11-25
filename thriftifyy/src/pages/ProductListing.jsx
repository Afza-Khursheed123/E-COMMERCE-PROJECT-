import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";
import colors from "../theme";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";

const ProductListingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    condition: "Like New",
    categoryId: "",
    images: [],
    biddingEnabled: false,
    swappable: false,
    location: "",
    quantity: "1",
    tags: "",
  });

  const [imagePreview, setImagePreview] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/category");
        setCategories(res.data);
      } catch (err) {
        console.error("Categories fetch error:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ UPDATED: No MB limit for image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((base64Images) => {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...base64Images],
      }));
      setImagePreview([...imagePreview, ...base64Images]);
    });
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setImagePreview(imagePreview.filter((_, i) => i !== index));
  };

  // ✅ UPDATED: No required field validation - allow optional fields
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in to list an item.");

    setLoading(true);
    try {
      const price = formData.price ? parseFloat(formData.price) : 0;
      const originalPrice = formData.originalPrice
        ? parseFloat(formData.originalPrice)
        : price;

      const discount =
        originalPrice > price && price > 0
          ? Math.round(((originalPrice - price) / originalPrice) * 100)
          : 0;

      // ✅ Allow submission with minimal required fields
      if (!formData.name || !formData.categoryId) {
        return alert("Please provide at least product name and category.");
      }

      const productData = {
        ...formData,
        price,
        originalPrice,
        discount,
        categoryId: parseInt(formData.categoryId),
        quantity: parseInt(formData.quantity) || 1,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          location: user.location,
          phone: user.phone,
          rating: user.rating || 0,
        },
      };

      const res = await api.post("/productlisting", productData);
      alert("✅ Product listed successfully!");
      navigate(`/products/${res.data._id}`);
    } catch (err) {
      console.error("Listing error:", err);
      alert("Failed to list product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ minHeight: "100vh", background: colors.text, paddingTop: "2rem", paddingBottom: "2rem" }}>
      <Container>
        {/* Header Section with Animation */}
        <Row className="mb-5">
          <Col lg={12}>
            <div style={{ marginBottom: "2rem" }}>
              <Button
                onClick={() => navigate(-1)}
                style={{
                  backgroundColor: colors.accent,
                  border: "none",
                  color: colors.text,
                  borderRadius: "12px",
                  padding: "10px 20px",
                  marginBottom: "1.5rem",
                  transition: "all 0.3s ease",
                  fontWeight: "600"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateX(-5px)";
                  e.target.style.boxShadow = "0 8px 20px rgba(11, 122, 117, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateX(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                ← Back to Home
              </Button>
            </div>

            <div style={{ position: "relative", marginBottom: "3rem" }}>
              <h1
                style={{
                  fontSize: "2.8rem",
                  fontWeight: "700",
                  color: colors.bg,
                  marginBottom: "0.5rem",
                  letterSpacing: "-1px"
                }}
              >
                List Your Item
              </h1>
              <div
                style={{
                  width: "80px",
                  height: "4px",
                  background: `linear-gradient(90deg, ${colors.accent}, ${colors.highlight})`,
                  borderRadius: "2px",
                  marginBottom: "1rem"
                }}
              ></div>
              <p style={{ color: colors.bg, opacity: 0.7, fontSize: "1.1rem" }}>
                Share your item with thousands of shoppers and start earning today
              </p>
            </div>
          </Col>
        </Row>

        {/* Main Form Card */}
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card
              style={{
                borderRadius: "20px",
                border: "none",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                overflow: "hidden",
                background: "#ffffff"
              }}
            >
              <Card.Body style={{ padding: "3rem" }}>
                <Form onSubmit={handleSubmit}>
                  {/* Product Name & Category Row */}
                  <Row className="mb-4">
                    <Col md={6} className="mb-3 mb-md-0">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", color: colors.bg, marginBottom: "0.8rem" }}>
                          Product Name *
                        </Form.Label>
                        <Form.Control
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter product name"
                          style={{
                            borderRadius: "12px",
                            border: `2px solid #e0e0e0`,
                            padding: "12px 16px",
                            fontSize: "1rem",
                            transition: "all 0.3s ease"
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = colors.accent;
                            e.target.style.boxShadow = `0 0 0 3px rgba(11, 122, 117, 0.1)`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e0e0e0";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", color: colors.bg, marginBottom: "0.8rem" }}>
                          Category *
                        </Form.Label>
                        <Form.Select
                          name="categoryId"
                          value={formData.categoryId}
                          onChange={handleInputChange}
                          style={{
                            borderRadius: "12px",
                            border: `2px solid #e0e0e0`,
                            padding: "12px 16px",
                            fontSize: "1rem",
                            transition: "all 0.3s ease"
                          }}
                        >
                          <option value="">Select a category</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                    
                    </Col>
                  </Row>

                  {/* Description */}
                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: "600", color: colors.bg, marginBottom: "0.8rem" }}>
                      Description
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your product in detail..."
                      rows={4}
                      style={{
                        borderRadius: "12px",
                        border: `2px solid #e0e0e0`,
                        padding: "12px 16px",
                        fontSize: "1rem",
                        transition: "all 0.3s ease",
                        fontFamily: "inherit"
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.accent;
                        e.target.style.boxShadow = `0 0 0 3px rgba(11, 122, 117, 0.1)`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e0e0e0";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </Form.Group>

                  {/* Price Row */}
                  <Row className="mb-4">
                    <Col md={6} className="mb-3 mb-md-0">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", color: colors.bg, marginBottom: "0.8rem" }}>
                          Selling Price
                        </Form.Label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.accent, fontWeight: "600" }}>
                            $
                          </span>
                          <Form.Control
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            step="0.01"
                            style={{
                              borderRadius: "12px",
                              border: `2px solid #e0e0e0`,
                              padding: "12px 16px 12px 40px",
                              fontSize: "1rem",
                              transition: "all 0.3s ease"
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = colors.accent;
                              e.target.style.boxShadow = `0 0 0 3px rgba(11, 122, 117, 0.1)`;
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e0e0e0";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", color: colors.bg, marginBottom: "0.8rem" }}>
                          Original Price (Optional)
                        </Form.Label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.accent, fontWeight: "600" }}>
                            $
                          </span>
                          <Form.Control
                            type="number"
                            name="originalPrice"
                            value={formData.originalPrice}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            step="0.01"
                            style={{
                              borderRadius: "12px",
                              border: `2px solid #e0e0e0`,
                              padding: "12px 16px 12px 40px",
                              fontSize: "1rem",
                              transition: "all 0.3s ease"
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = colors.accent;
                              e.target.style.boxShadow = `0 0 0 3px rgba(11, 122, 117, 0.1)`;
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e0e0e0";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Condition & Quantity Row */}
                  <Row className="mb-4">
                    <Col md={6} className="mb-3 mb-md-0">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", color: colors.bg, marginBottom: "0.8rem" }}>
                          Condition
                        </Form.Label>
                        <Form.Select
                          name="condition"
                          value={formData.condition}
                          onChange={handleInputChange}
                          style={{
                            borderRadius: "12px",
                            border: `2px solid #e0e0e0`,
                            padding: "12px 16px",
                            fontSize: "1rem",
                            transition: "all 0.3s ease"
                          }}
                        >
                          <option>Like New</option>
                          <option>Excellent</option>
                          <option>Good</option>
                          <option>Fair</option>
                          <option>Used</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", color: colors.bg, marginBottom: "0.8rem" }}>
                          Quantity
                        </Form.Label>
                        <Form.Control
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          placeholder="1"
                          min="1"
                          style={{
                            borderRadius: "12px",
                            border: `2px solid #e0e0e0`,
                            padding: "12px 16px",
                            fontSize: "1rem",
                            transition: "all 0.3s ease"
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = colors.accent;
                            e.target.style.boxShadow = `0 0 0 3px rgba(11, 122, 117, 0.1)`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e0e0e0";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Location & Tags Row */}
                  <Row className="mb-4">
                    <Col md={6} className="mb-3 mb-md-0">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", color: colors.bg, marginBottom: "0.8rem" }}>
                          Location
                        </Form.Label>
                        <Form.Control
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="City, State"
                          style={{
                            borderRadius: "12px",
                            border: `2px solid #e0e0e0`,
                            padding: "12px 16px",
                            fontSize: "1rem",
                            transition: "all 0.3s ease"
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = colors.accent;
                            e.target.style.boxShadow = `0 0 0 3px rgba(11, 122, 117, 0.1)`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e0e0e0";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", color: colors.bg, marginBottom: "0.8rem" }}>
                          Tags (comma-separated)
                        </Form.Label>
                        <Form.Control
                          name="tags"
                          value={formData.tags}
                          onChange={handleInputChange}
                          placeholder="e.g., vintage, eco-friendly, designer"
                          style={{
                            borderRadius: "12px",
                            border: `2px solid #e0e0e0`,
                            padding: "12px 16px",
                            fontSize: "1rem",
                            transition: "all 0.3s ease"
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = colors.accent;
                            e.target.style.boxShadow = `0 0 0 3px rgba(11, 122, 117, 0.1)`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e0e0e0";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Feature Checkboxes */}
                  <div className="mb-4" style={{ padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "12px", border: `2px solid #e0e0e0` }}>
                    <h6 style={{ fontWeight: "600", color: colors.bg, marginBottom: "1rem" }}>Product Features</h6>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Check
                          type="checkbox"
                          name="biddingEnabled"
                          label="Enable Bidding"
                          checked={formData.biddingEnabled}
                          onChange={handleInputChange}
                          style={{ cursor: "pointer" }}
                        />
                        <small className="text-muted d-block mt-1">Allow buyers to place offers on this item</small>
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          name="swappable"
                          label="Available for Swap"
                          checked={formData.swappable}
                          onChange={handleInputChange}
                          style={{ cursor: "pointer" }}
                        />
                        <small className="text-muted d-block mt-1">Accept trade-ins for this item</small>
                      </Col>
                    </Row>
                  </div>

                  {/* Image Upload Section */}
                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: "600", color: colors.bg, marginBottom: "0.8rem" }}>
                      Product Images (No size limit)
                    </Form.Label>
                    <div
                      style={{
                        borderRadius: "12px",
                        border: `2px dashed ${colors.accent}`,
                        padding: "40px",
                        textAlign: "center",
                        cursor: "pointer",
                        backgroundColor: "rgba(11, 122, 117, 0.05)",
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(11, 122, 117, 0.1)";
                        e.currentTarget.style.borderColor = colors.bg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(11, 122, 117, 0.05)";
                        e.currentTarget.style.borderColor = colors.accent;
                      }}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: "none" }}
                        id="imageInput"
                      />
                      <label htmlFor="imageInput" style={{ cursor: "pointer", marginBottom: 0 }}>
                        <i
                          className="fa-solid fa-cloud-arrow-up"
                          style={{ fontSize: "2.5rem", color: colors.accent, marginBottom: "1rem", display: "block" }}
                        ></i>
                        <p style={{ fontSize: "1.1rem", fontWeight: "600", color: colors.bg, marginBottom: "0.5rem" }}>
                          Click to upload images
                        </p>
                        <p style={{ color: colors.bg, opacity: 0.6, marginBottom: 0 }}>
                          or drag and drop • PNG, JPG, GIF up to any size
                        </p>
                      </label>
                    </div>

                    {/* Image Preview Grid */}
                    {imagePreview.length > 0 && (
                      <div style={{ marginTop: "2rem" }}>
                        <h6 style={{ fontWeight: "600", color: colors.bg, marginBottom: "1rem" }}>
                          Image Preview ({imagePreview.length})
                        </h6>
                        <Row className="g-3">
                          {imagePreview.map((img, idx) => (
                            <Col xs={6} sm={4} md={3} key={idx}>
                              <div
                                style={{
                                  position: "relative",
                                  borderRadius: "12px",
                                  overflow: "hidden",
                                  border: `2px solid #e0e0e0`,
                                  transition: "all 0.3s ease"
                                }}
                              >
                                <img
                                  src={img}
                                  alt={`Preview ${idx}`}
                                  style={{
                                    width: "100%",
                                    height: "150px",
                                    objectFit: "cover",
                                    display: "block"
                                  }}
                                />
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => removeImage(idx)}
                                  style={{
                                    position: "absolute",
                                    top: "8px",
                                    right: "8px",
                                    borderRadius: "50%",
                                    width: "32px",
                                    height: "32px",
                                    padding: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease"
                                  }}
                                >
                                  ✕
                                </Button>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    )}
                  </Form.Group>

                  {/* Submit Button */}
                  <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      style={{
                        flex: 1,
                        backgroundColor: colors.accent,
                        border: "none",
                        color: "#fff",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        borderRadius: "12px",
                        padding: "14px 28px",
                        transition: "all 0.3s ease",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-3px)";
                        e.target.style.boxShadow = "0 12px 30px rgba(11, 122, 117, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      {loading ? "Publishing..." : "✓ Publish Listing"}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => navigate(-1)}
                      style={{
                        backgroundColor: "#e0e0e0",
                        border: "none",
                        color: colors.bg,
                        fontSize: "1rem",
                        fontWeight: "600",
                        borderRadius: "12px",
                        padding: "14px 28px",
                        transition: "all 0.3s ease",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#d0d0d0";
                        e.target.style.transform = "translateY(-3px)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#e0e0e0";
                        e.target.style.transform = "translateY(0)";
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Helper Text */}
        <Row className="mt-5">
          <Col lg={10} className="mx-auto">
            <div style={{ textAlign: "center", color: colors.bg, opacity: 0.7 }}>
              <p>
                <i className="fa-solid fa-info-circle me-2"></i>
                Fields marked with * are required. All other fields are optional to help improve listing visibility.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ProductListingPage;
