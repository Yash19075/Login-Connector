import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Axios } from "../lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ShoppingCart,
  Minus,
  Plus,
  Star,
  CheckCircle,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

const BuyItemPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);

  // Helper functions to get current user and token from context or localStorage
  const getCurrentUser = () => {
    if (user) return user;
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error parsing stored user:", error);
      return null;
    }
  };

  const getCurrentToken = () => {
    return token || localStorage.getItem("token");
  };

  // Get current authentication state
  const currentUser = getCurrentUser();
  const currentToken = getCurrentToken();
  const isAuthenticated = !!(currentUser?._id && currentToken);

  useEffect(() => {
    fetchItemDetail();
  }, [itemId]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      console.log("Razorpay script loaded successfully");
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      setError("Failed to load payment gateway. Please refresh the page.");
    };
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        // Script might have been removed already
      }
    };
  }, []);

  const fetchItemDetail = async () => {
    try {
      console.log("Fetching item details for:", itemId);

      const authToken = getCurrentToken();

      if (!authToken) {
        console.log("No auth token available");
        setError("Please log in to view item details");
        setLoading(false);
        return;
      }

      const response = await Axios.get(`/items/${itemId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log("Item fetch response:", response.data);
      if (response.data && response.data.data) {
        setItem(response.data.data);
      } else if (response.data) {
        setItem(response.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching item:", err);
      setError(err.response?.data?.message || "Failed to fetch item details");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= item.quantity) {
      setQuantity(newQuantity);
    }
  };

  const createRazorpayOrder = async () => {
    try {
      const authToken = getCurrentToken();
      const userData = getCurrentUser();

      console.log("Creating order with:", {
        itemId,
        quantity,
        authToken: !!authToken,
        userData: userData?._id,
      });

      if (!authToken) {
        throw new Error("Authentication token missing. Please log in again.");
      }

      const response = await Axios.post(
        `/razorpay/items/${itemId}/create-order`,
        { quantity },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Order creation response:", response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to create order");
      }

      return response.data.data;
    } catch (err) {
      console.error("Create order error:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to create order";
      throw new Error(errorMessage);
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      console.log("Verifying payment:", paymentData);

      const authToken = getCurrentToken();
      if (!authToken) {
        throw new Error("Authentication token missing");
      }

      const response = await Axios.post(
        `/razorpay/items/${itemId}/verify-payment`,
        {
          ...paymentData,
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Payment verification response:", response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Payment verification failed");
      }

      return response.data.data;
    } catch (err) {
      console.error("Payment verification error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Payment verification failed";
      throw new Error(errorMessage);
    }
  };

  const handleRazorpayPayment = async () => {
    const userData = getCurrentUser();
    const authToken = getCurrentToken();

    // Validation checks
    if (!userData?._id || !authToken) {
      setError("Please log in to make a purchase");
      return;
    }

    if (!item) {
      setError("Item details not loaded. Please refresh the page.");
      return;
    }

    if (quantity <= 0 || quantity > item.quantity) {
      setError(`Please select a valid quantity (1-${item.quantity})`);
      return;
    }

    // Check if Razorpay is loaded
    if (!window.Razorpay) {
      setError(
        "Payment gateway not loaded. Please refresh the page and try again."
      );
      return;
    }

    // Check if Razorpay key is configured
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey || razorpayKey === "YOUR_RAZORPAY_KEY_ID") {
      setError(
        "Payment gateway not configured. Please add VITE_RAZORPAY_KEY_ID to your .env file."
      );
      return;
    }

    setPurchasing(true);
    setError("");

    try {
      // Create order on backend
      const orderData = await createRazorpayOrder();
      console.log("Order data received:", orderData);

      if (!orderData.id || !orderData.amount) {
        throw new Error("Invalid order data received from server");
      }

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Your Marketplace",
        description: `Purchase of ${item.name}`,
        order_id: orderData.id,
        image: item.picture || "/default-item-image.png",
        handler: async (response) => {
          console.log("Payment successful, response:", response);
          try {
            // Verify payment on backend
            const verificationData = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            console.log("Payment verification successful:", verificationData);
            setOrderData(verificationData);
            setSuccess(true);

            // Update item quantity locally
            setItem((prev) => ({
              ...prev,
              quantity: Math.max(0, prev.quantity - quantity),
              status:
                prev.quantity - quantity <= 0 ? "out-of-stock" : prev.status,
            }));
          } catch (verificationError) {
            console.error("Payment verification failed:", verificationError);
            setError(
              `Payment successful but verification failed: ${verificationError.message}. Please contact support.`
            );
          } finally {
            setPurchasing(false);
          }
        },
        prefill: {
          name: userData?.fullName || userData?.username || "",
          email: userData?.email || "",
          contact: userData?.phone || "",
        },
        notes: {
          item_id: itemId,
          quantity: quantity.toString(),
          user_id: userData?._id,
          item_name: item.name,
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: () => {
            console.log("Payment modal dismissed by user");
            setPurchasing(false);
            // Don't set error on dismiss - user might have cancelled intentionally
          },
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      // Create Razorpay instance
      const razorpay = new window.Razorpay(options);

      // Add error handler
      razorpay.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        setError(
          `Payment failed: ${
            response.error.description || response.error.reason
          }`
        );
        setPurchasing(false);
      });

      // Open Razorpay modal
      console.log("Opening Razorpay modal...");
      razorpay.open();
    } catch (err) {
      console.error("Error initiating payment:", err);
      setError(err.message);
      setPurchasing(false);
    }
  };

  const getAverageRating = (reviewsArray) => {
    if (!reviewsArray || reviewsArray.length === 0) return 0;
    const total = reviewsArray.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviewsArray.length).toFixed(1);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            className="w-4 h-4 fill-yellow-400/50 text-yellow-400"
          />
        );
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
              <Button asChild>
                <Link to="/all-items">Back to Items</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success && orderData) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Payment Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Order Details</h3>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-mono text-sm">{orderData._id}</span>
                  </div>
                  {orderData.razorpayPaymentId && (
                    <div className="flex justify-between">
                      <span>Payment ID:</span>
                      <span className="font-mono text-sm">
                        {orderData.razorpayPaymentId}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Item:</span>
                    <span>{orderData.item?.name || item?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>{orderData.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unit Price:</span>
                    <span>₹{orderData.price}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{orderData.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="secondary">{orderData.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <Badge variant="default" className="bg-green-600">
                      {orderData.paymentStatus}
                    </Badge>
                  </div>
                  {orderData.seller && (
                    <div className="flex justify-between">
                      <span>Seller:</span>
                      <span>
                        {orderData.seller?.fullName ||
                          orderData.seller?.username ||
                          "Unknown"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link to="/all-items">Continue Shopping</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link to={`/item/${itemId}`}>View Item</Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Your payment has been processed successfully. The seller will be
                notified and will contact you soon for delivery.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalPrice = item ? item.price * quantity : 0;
  const avgRating = getAverageRating(item?.reviews || []);
  const canPurchase =
    item &&
    item.quantity > 0 &&
    item.status !== "out-of-stock" &&
    currentUser?._id !== item?.postedBy?._id;

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/items/${itemId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Item
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Item Details */}
          <div>
            <Card className="h-fit">
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={item.picture}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/default-item-image.png";
                  }}
                />
              </div>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-2">{item.name}</h1>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {renderStars(avgRating)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {avgRating > 0
                      ? `${avgRating} (${item.reviews?.length || 0} reviews)`
                      : "No reviews yet"}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-primary">
                    ₹{item.price}
                  </span>
                  <Badge
                    variant={
                      item.status === "in-stock" ? "default" : "destructive"
                    }
                  >
                    {item.status === "in-stock" ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Available quantity: {item.quantity}
                </p>

                {item.description && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="space-y-2">
                  <h3 className="font-semibold">Seller Information</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">
                        {item.postedBy?.fullName?.charAt(0) ||
                          item.postedBy?.username?.charAt(0) ||
                          "S"}
                      </span>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {item.postedBy?.fullName ||
                          item.postedBy?.username ||
                          "Unknown Seller"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.postedBy?.role || "Seller"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Section */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Purchase Item
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {!isAuthenticated && (
                  <Alert>
                    <AlertDescription>
                      Please{" "}
                      <Link to="/login" className="underline">
                        log in
                      </Link>{" "}
                      to purchase this item.
                    </AlertDescription>
                  </Alert>
                )}

                {isAuthenticated && !canPurchase ? (
                  <Alert>
                    <AlertDescription>
                      {currentUser._id === item?.postedBy?._id
                        ? "You cannot purchase your own item."
                        : item?.quantity <= 0 || item?.status === "out-of-stock"
                        ? "This item is currently out of stock."
                        : "This item is not available for purchase."}
                    </AlertDescription>
                  </Alert>
                ) : isAuthenticated && canPurchase ? (
                  <>
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Quantity</label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            handleQuantityChange(value);
                          }}
                          className="w-20 text-center"
                          min={1}
                          max={item.quantity}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= item.quantity}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum available: {item.quantity}
                      </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">
                        Price Breakdown
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Unit Price:</span>
                          <span>₹{item.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantity:</span>
                          <span>× {quantity}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total:</span>
                          <span className="text-primary">
                            ₹{totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleRazorpayPayment}
                      disabled={
                        purchasing ||
                        quantity <= 0 ||
                        quantity > item.quantity ||
                        !window.Razorpay ||
                        !import.meta.env.VITE_RAZORPAY_KEY_ID
                      }
                      className="w-full"
                      size="lg"
                    >
                      {purchasing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : !window.Razorpay ? (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Payment Gateway Loading...
                        </div>
                      ) : !import.meta.env.VITE_RAZORPAY_KEY_ID ? (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Payment Gateway Not Configured
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Pay ₹{totalPrice.toFixed(2)} with Razorpay
                        </div>
                      )}
                    </Button>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>🔒 Secure Payment</span>
                        <span>✓ No PIN Required</span>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <span>📱 UPI</span>
                        <span>💰 Wallets</span>
                        <span>🏦 NetBanking</span>
                        <span>💳 Cards</span>
                      </div>
                      <p className="text-xs text-green-600 text-center font-medium">
                        ⚡ Instant payments available - No PIN needed for UPI &
                        Wallets
                      </p>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyItemPage;
