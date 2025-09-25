import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Package,
  ShoppingCart,
  Star,
  MessageCircle,
  TrendingUp,
  Plus,
  Edit3,
  Eye,
  Trash2,
  Filter,
  Search,
  Bell,
  Settings,
  LogOut,
  Heart,
  Clock,
  DollarSign,
  Users,
  MoreHorizontal,
  Calendar,
  Activity,
  Mail,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "../context/AuthContext";
import { Axios } from "../lib/axios";

const Dashboard = () => {
  const { user: authUser, logout, token } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [chats, setChats] = useState([]);
  const [reviewsWritten, setReviewsWritten] = useState([]);
  const [reviewsReceived, setReviewsReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (authUser) {
      fetchDashboardData();
    }
  }, [authUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // First fetch user profile to determine role
      await fetchUserProfile();

      // Wait a bit for state to update, then continue with other calls
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // New effect to fetch data after user is loaded
  useEffect(() => {
    if (user) {
      const fetchRemainingData = async () => {
        try {
          const promises = [
            fetchUserItems(),
            fetchUserReviews(),
            fetchReceivedReviews(),
            fetchUserChats(),
          ];

          // Only fetch orders/sales based on user role
          if (user.role === "seller") {
            promises.push(fetchUserSales());
          } else {
            promises.push(fetchUserOrders());
          }

          await Promise.all(promises);
        } catch (error) {
          console.error("Error fetching remaining data:", error);
        }
      };

      fetchRemainingData();
    }
  }, [user]); // This runs when user state updates

  const fetchUserProfile = async () => {
    try {
      const response = await Axios.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data?.data || response.data;
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };

  const fetchUserItems = async () => {
    try {
      const response = await Axios.get("/items/getallItems", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allItems = response.data?.data || response.data;
      setItems(Array.isArray(allItems) ? allItems : []);
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    }
  };

  // FIXED: Fetch user's purchase orders with correct endpoint
  const fetchUserOrders = async () => {
    try {
      const response = await Axios.get("/orders/my-bought-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ordersData = response.data?.data || response.data;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      setOrders([]);
    }
  };

  // FIXED: Fetch seller's sales with correct endpoint
  const fetchUserSales = async () => {
    try {
      if (user?.role === "seller") {
        console.log("Fetching sales for seller:", user._id);
        const response = await Axios.get("/orders/my-sold-orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Sales response:", response.data);
        const salesData = response.data?.data || response.data;
        console.log("Processed sales data:", salesData);
        setSales(Array.isArray(salesData) ? salesData : []);
      }
    } catch (error) {
      console.error("Error fetching user sales:", error);
      console.error("Sales error details:", error.response?.data);
      setSales([]);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const response = await Axios.get("/users/reviews", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const reviewsData = response.data?.data || response.data;
      setReviewsWritten(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      setReviewsWritten([]);
    }
  };

  const fetchReceivedReviews = async () => {
    try {
      const response = await Axios.get("/users/reviews/received", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const reviewsData = response.data?.data || response.data;
      setReviewsReceived(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      console.error("Error fetching received reviews:", error);
      setReviewsReceived([]);
    }
  };

  const fetchUserChats = async () => {
    try {
      const response = await Axios.get("/chats/all-chats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const chatsData = response.data?.data || response.data;
      setChats(Array.isArray(chatsData) ? chatsData : []);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setChats([]);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getRoleBadgeColor = (role) => {
    return role === "seller"
      ? "bg-blue-500 hover:bg-blue-600"
      : "bg-green-500 hover:bg-green-600";
  };

  const getStats = () => {
    if (!user) return {};

    if (user.role === "seller") {
      const userItems = items.filter(
        (item) => item.postedBy?._id === user._id || item.postedBy === user._id
      );
      const activeItems = userItems.filter((item) => item.quantity > 0).length;
      const soldOutItems = userItems.filter(
        (item) => item.quantity === 0
      ).length;

      // Calculate revenue from completed sales
      const completedSales = sales.filter(
        (sale) =>
          sale.status === "completed" || sale.paymentStatus === "completed"
      );
      const totalRevenue = completedSales.reduce(
        (sum, sale) => sum + (sale.totalAmount || 0),
        0
      );
      const totalSalesCount = completedSales.length;

      // Calculate average rating
      const avgRating =
        reviewsReceived.length > 0
          ? (
              reviewsReceived.reduce((sum, review) => sum + review.rating, 0) /
              reviewsReceived.length
            ).toFixed(1)
          : 0;

      return {
        totalItems: userItems.length,
        activeItems,
        soldOutItems,
        totalRevenue,
        totalSalesCount,
        pendingSales: sales.filter((sale) => sale.status === "pending").length,
        unreadMessages: chats.filter((chat) => chat.unreadCount > 0).length,
        averageRating: parseFloat(avgRating),
        totalRatings: reviewsReceived.length,
      };
    } else {
      // Buyer stats
      const completedOrders = orders.filter(
        (order) =>
          order.status === "completed" || order.paymentStatus === "completed"
      );
      const pendingOrders = orders.filter(
        (order) => order.status === "pending"
      );
      const totalSpent = completedOrders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0
      );

      return {
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        pendingOrders: pendingOrders.length,
        totalSpent,
        reviewsWritten: reviewsWritten.length,
        unreadMessages: chats.filter((chat) => chat.unreadCount > 0).length,
        recentViews: items.slice(0, 10).length,
      };
    }
  };

  const getDisplayItems = () => {
    if (!user) return [];

    if (user.role === "seller") {
      return items.filter(
        (item) => item.postedBy?._id === user._id || item.postedBy === user._id
      );
    }
    return items.slice(0, 12); // Show recent items for buyers
  };

  const filteredItems = getDisplayItems().filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating) => {
    const numRating = Number(rating) || 0;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${
              index < numRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const handleLogout = async () => {
    try {
      await Axios.post(
        "/users/logout",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API call fails, still logout locally
      logout();
      navigate("/login");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await Axios.delete(`/items/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Refresh items after deletion
        fetchUserItems();
      } catch (error) {
        console.error("Error deleting item:", error);
        setError("Failed to delete item. Please try again.");
      }
    }
  };

  const handleEditItem = (itemId) => {
    navigate(`/item/${itemId}/updateItem`);
  };

  const handleViewItem = (itemId) => {
    navigate(`/item/${itemId}`);
  };

  const handleStartChat = (itemId, otherUserId) => {
    navigate(`/chats/${itemId}/${otherUserId}`);
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const getOrderStatusBadge = (order) => {
    const status = order.status;
    const paymentStatus = order.paymentStatus;

    if (paymentStatus === "completed" && status === "completed") {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (paymentStatus === "failed" || status === "cancelled") {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    }
    if (status === "confirmed" && paymentStatus === "completed") {
      return (
        <Badge className="bg-blue-500">
          <Clock className="w-3 h-3 mr-1" />
          Processing
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} alt={user.fullName} />
            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user.fullName}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getRoleBadgeColor(user.role)}>
                <Shield className="h-3 w-3 mr-1" />
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
              {user.role === "seller" && stats.averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">
                    {stats.averageRating} ({stats.totalRatings} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {stats.unreadMessages > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unreadMessages}
              </Badge>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {user.role === "seller" ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Items
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeItems} active, {stats.soldOutItems} sold out
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {stats.totalSalesCount} completed sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.averageRating || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalRatings} total ratings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalSalesCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingSales} pending
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedOrders} completed, {stats.pendingOrders}{" "}
                  pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Spent
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalSpent.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  On completed orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Reviews Written
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.reviewsWritten}</div>
                <p className="text-xs text-muted-foreground">Items reviewed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chats.length}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.unreadMessages} unread
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">
            {user.role === "seller" ? "My Items" : "Browse Items"}
          </TabsTrigger>
          <TabsTrigger value="orders">
            {user.role === "seller" ? "Sales" : "Orders"}
          </TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.role === "seller"
                    ? sales.slice(0, 3).map((sale) => (
                        <div
                          key={sale._id}
                          className="flex items-start gap-3 p-3 border rounded-lg"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={sale.buyer?.avatar} />
                            <AvatarFallback>
                              {getInitials(sale.buyer?.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">
                                {sale.buyer?.fullName}
                              </span>
                              {" purchased "}
                              <span className="font-medium">
                                {sale.item?.name}
                              </span>
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {getOrderStatusBadge(sale)}
                              <span className="text-xs text-muted-foreground">
                                ${sale.totalAmount} •{" "}
                                {new Date(sale.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    : orders.slice(0, 3).map((order) => (
                        <div
                          key={order._id}
                          className="flex items-start gap-3 p-3 border rounded-lg"
                        >
                          <img
                            src={order.item?.picture}
                            alt={order.item?.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">
                                {order.item?.name}
                              </span>
                              {" from "}
                              <span className="font-medium">
                                {order.seller?.fullName}
                              </span>
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {getOrderStatusBadge(order)}
                              <span className="text-xs text-muted-foreground">
                                ${order.totalAmount} •{" "}
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                  {((user.role === "seller" && sales.length === 0) ||
                    (user.role === "buyer" && orders.length === 0)) && (
                    <p className="text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.role === "seller" ? (
                  <>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => navigate("/create-item")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Item
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => setActiveTab("orders")}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Sales
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => setActiveTab("messages")}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Manage Messages
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => navigate("/all-items")}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Browse Items
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => setActiveTab("orders")}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      My Orders
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => setActiveTab("reviews")}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Write Reviews
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            {user.role === "seller" && (
              <Button onClick={() => navigate("/create-item")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item._id}>
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  <img
                    src={item.picture}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge
                    className={`absolute top-2 right-2 ${
                      item.quantity > 0 ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {item.quantity > 0 ? "Available" : "Sold Out"}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg truncate">
                      {item.name}
                    </h3>
                    {user.role === "seller" &&
                      (item.postedBy?._id === user._id ||
                        item.postedBy === user._id) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleEditItem(item._id)}
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteItem(item._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                  </div>

                  <p className="text-2xl font-bold text-green-600 mb-2">
                    ${item.price}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span>Qty: {item.quantity}</span>
                    <span>{item.category}</span>
                  </div>

                  {user.role === "seller" &&
                    (item.postedBy?._id === user._id ||
                      item.postedBy === user._id) && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {item.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {item.likes || 0}
                        </span>
                      </div>
                    )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      By @{item.postedBy?.username}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewItem(item._id)}
                    >
                      {user.role === "seller" &&
                      (item.postedBy?._id === user._id ||
                        item.postedBy === user._id)
                        ? "Manage"
                        : "View Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No items found matching your search."
                  : user.role === "seller"
                  ? "You haven't posted any items yet."
                  : "No items available."}
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Orders/Sales Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {user.role === "seller" ? "Recent Sales" : "My Orders"}
              </CardTitle>
              <CardDescription>
                {user.role === "seller"
                  ? "Orders placed for your items"
                  : "Items you've purchased"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(user.role === "seller" ? sales : orders).length > 0 ? (
                <div className="space-y-4">
                  {(user.role === "seller" ? sales : orders).map((order) => (
                    <div
                      key={order._id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <img
                        src={order.item?.picture}
                        alt={order.item?.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium truncate">
                            {order.item?.name}
                          </h4>
                          {getOrderStatusBadge(order)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Qty: {order.quantity}</span>
                          <span>${order.totalAmount}</span>
                          <span>
                            {user.role === "seller" ? "Buyer" : "Seller"}:
                            {user.role === "seller"
                              ? order.buyer?.fullName
                              : order.seller?.fullName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          {order.paymentCompletedAt && (
                            <>
                              <span>•</span>
                              <span>
                                Paid:{" "}
                                {new Date(
                                  order.paymentCompletedAt
                                ).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewItem(order.item?._id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Item
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {user.role === "seller" ? "No sales yet" : "No orders yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {chats.length > 0 ? (
                <div className="space-y-4">
                  {chats.map((chat, index) => (
                    <div
                      key={`${chat.item?._id}-${chat.otherUser?._id}-${index}`}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        handleStartChat(chat.item?._id, chat.otherUser?._id)
                      }
                    >
                      <Avatar>
                        <AvatarImage src={chat.otherUser?.avatar} />
                        <AvatarFallback>
                          {getInitials(chat.otherUser?.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {chat.otherUser?.fullName}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {chat.lastMessageAt &&
                              new Date(chat.lastMessageAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          About: {chat.item?.name}
                        </p>
                        {chat.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.lastMessage}
                          </p>
                        )}
                      </div>
                      {chat.unreadCount > 0 && (
                        <Badge variant="destructive">{chat.unreadCount}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No messages yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reviews Written */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews Written</CardTitle>
                <CardDescription>
                  Reviews you've written for items
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviewsWritten.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {reviewsWritten.map((review) => (
                      <div key={review._id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-2">
                          <img
                            src={review.item?.picture}
                            alt={review.item?.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <h4 className="font-medium">{review.item?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${review.item?.price}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">
                            "{review.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No reviews written yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews Received */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews Received</CardTitle>
                <CardDescription>
                  {user.role === "seller"
                    ? "Reviews buyers have left for your items"
                    : "Only sellers receive reviews"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.role === "seller" && reviewsReceived.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {reviewsReceived.map((review) => (
                      <div key={review._id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={review.reviewBy?.avatar} />
                            <AvatarFallback>
                              {getInitials(review.reviewBy?.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">
                              {review.reviewBy?.fullName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              for {review.item?.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">
                            "{review.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {user.role === "seller"
                        ? "No reviews received yet"
                        : "Only sellers receive reviews"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
