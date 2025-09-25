import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Axios } from "../lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateItem = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    category: "",
    picture: null,
  });

  // Category options matching backend enum
  const categories = [
    { value: "Electronics", label: "Electronics" },
    { value: "Fashion", label: "Fashion" },
    { value: "Utilities", label: "Utilities" },
    { value: "Entertainment", label: "Entertainment" },
  ];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "picture") {
      setFormData((prev) => ({ ...prev, picture: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (
      !formData.name ||
      !formData.price ||
      !formData.quantity ||
      !formData.category ||
      !formData.picture
    ) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (formData.price <= 0 || formData.quantity <= 0) {
      setError("Price and quantity must be greater than 0");
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("quantity", formData.quantity);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("picture", formData.picture);

      const response = await Axios.post("/items/create-item", formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        // Reset form
        setFormData({
          name: "",
          price: "",
          quantity: "",
          category: "",
          picture: null,
        });
        navigate("/all-items");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create item. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === "buyer") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Access Denied
            </h2>
            <p className="text-muted-foreground">
              Only sellers can create items. Please switch to a seller account
              to create items.
            </p>
            <Button
              onClick={() => navigate("/all-items")}
              className="mt-4 w-full"
              variant="outline"
            >
              View All Items
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Create New Item</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  placeholder="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="picture">Item Picture</Label>
                <Input
                  id="picture"
                  name="picture"
                  type="file"
                  onChange={handleChange}
                  accept="image/*"
                  required
                />
                {formData.picture && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {formData.picture.name}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Item..." : "Create Item"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                onClick={() => navigate("/all-items")}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateItem;
