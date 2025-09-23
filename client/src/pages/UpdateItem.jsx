import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Axios } from "../lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Upload, X } from "lucide-react";

const UpdateItem = () => {
  const { itemId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
  });
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    fetchItemDetail();
  }, [itemId]);

  const fetchItemDetail = async () => {
    try {
      const response = await Axios.get("/items/getallItems", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        const foundItem = response.data.data.find(
          (item) => item._id === itemId
        );

        if (foundItem) {
          // Check if current user owns this item
          if (foundItem.postedBy._id !== user._id) {
            setError("You can only edit items that you created");
            return;
          }

          setItem(foundItem);
          setFormData({
            name: foundItem.name || "",
            price: foundItem.price || "",
            quantity: foundItem.quantity || "",
          });
          setImagePreview(foundItem.picture || "");
        } else {
          setError("Item not found");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch item details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      setNewImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const removeImage = () => {
    setNewImage(null);
    setImagePreview(item?.picture || "");
    // Reset file input
    const fileInput = document.getElementById("picture");
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error("Item name is required");
      }

      if (!formData.price || formData.price <= 0) {
        throw new Error("Price must be greater than 0");
      }

      if (!formData.quantity || formData.quantity < 0) {
        throw new Error("Quantity must be 0 or greater");
      }

      // Create FormData for file upload
      const updateData = new FormData();
      updateData.append("name", formData.name.trim());
      updateData.append("price", formData.price);
      updateData.append("quantity", formData.quantity);

      if (newImage) {
        updateData.append("picture", newImage);
      }

      const response = await Axios.put(`/items/${itemId}/update`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        setSuccess("Item updated successfully!");
        setTimeout(() => {
          navigate(`/item/${itemId}`);
        }, 1500);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to update item"
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button asChild>
              <Link to="/all-items">Back to Items</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/item/${itemId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Item
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Update Item</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload Section */}
              <div className="space-y-4">
                <label className="text-sm font-medium">Item Picture</label>

                {imagePreview && (
                  <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Item preview"
                      className="w-full h-full object-cover"
                    />
                    {newImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("picture").click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {newImage ? "Change Image" : "Upload New Image"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep current image. Supported formats: JPG,
                  PNG, GIF (Max 5MB)
                </p>
              </div>

              {/* Item Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Item Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter item name"
                  required
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">
                  Price ($) *
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantity *
                </label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={updating}>
                  {updating ? "Updating..." : "Update Item"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/item/${itemId}`)}
                  disabled={updating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateItem;
