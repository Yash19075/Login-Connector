import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Axios } from "../lib/axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, SortAsc, SortDesc, Tag, User } from "lucide-react";

const AllItems = () => {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "Electronics", label: "Electronics" },
    { value: "Fashion", label: "Fashion" },
    { value: "Utilities", label: "Utilities" },
    { value: "Entertainment", label: "Entertainment" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "rating-high", label: "Rating: High to Low" },
    { value: "rating-low", label: "Rating: Low to High" },
    { value: "seller-rating", label: "Seller Rating: High to Low" },
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    sortAndFilterItems();
  }, [items, sortBy, categoryFilter]);

  const fetchItems = async () => {
    try {
      const response = await Axios.get("/items/getallItems", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setItems(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  const getAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return parseFloat((total / reviews.length).toFixed(1));
  };

  const getSellerAverageRating = (sellerId) => {
    // Calculate seller's average rating across all their items
    const sellerItems = items.filter((item) => item.postedBy?._id === sellerId);
    if (sellerItems.length === 0) return 0;

    let totalRatings = 0;
    let totalReviews = 0;

    sellerItems.forEach((item) => {
      if (item.reviews && item.reviews.length > 0) {
        const sum = item.reviews.reduce(
          (acc, review) => acc + review.rating,
          0
        );
        totalRatings += sum;
        totalReviews += item.reviews.length;
      }
    });

    return totalReviews > 0
      ? parseFloat((totalRatings / totalReviews).toFixed(1))
      : 0;
  };

  const sortAndFilterItems = () => {
    let filtered = [...items];

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating-high":
          return getAverageRating(b.reviews) - getAverageRating(a.reviews);
        case "rating-low":
          return getAverageRating(a.reviews) - getAverageRating(b.reviews);
        case "seller-rating":
          return (
            getSellerAverageRating(b.postedBy?._id) -
            getSellerAverageRating(a.postedBy?._id)
          );
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
  };

  const getCategoryBadgeColor = (category) => {
    switch (category?.toLowerCase()) {
      case "electronics":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "fashion":
        return "bg-pink-500 hover:bg-pink-600 text-white";
      case "utilities":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "entertainment":
        return "bg-purple-500 hover:bg-purple-600 text-white";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white";
    }
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

  // Component for clickable user names
  const ClickableUserName = ({ userData, className = "", children }) => {
    if (!userData || userData._id === user?._id) {
      return <span className={className}>{children}</span>;
    }

    return (
      <Link
        to={`/profile/${userData._id}`}
        className={`${className} hover:underline hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1`}
      >
        <User className="w-3 h-3" />
        {children}
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={fetchItems}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">All Items</h1>
          <Button asChild>
            <Link to="/create-item">+ Create Item</Link>
          </Button>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-64">
                <Tag className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
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
          <div className="flex-1">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-64">
                <SortAsc className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results summary */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {items.length} items
            {categoryFilter !== "all" && (
              <span>
                {" "}
                in {categories.find((c) => c.value === categoryFilter)?.label}
              </span>
            )}
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <Card className="text-center p-12">
            <CardContent>
              <h2 className="text-2xl font-semibold mb-4">
                {items.length === 0
                  ? "No Items Found"
                  : "No Items Match Your Filters"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {items.length === 0
                  ? "Be the first to create an item!"
                  : "Try adjusting your filters or create a new item."}
              </p>
              <div className="flex gap-2 justify-center">
                {items.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCategoryFilter("all");
                      setSortBy("newest");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button asChild>
                  <Link to="/create-item">Create Item</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              const avgRating = getAverageRating(item.reviews);
              const sellerRating = getSellerAverageRating(item.postedBy?._id);
              return (
                <Card
                  key={item._id}
                  className="overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="aspect-video overflow-hidden relative">
                    <img
                      src={item.picture}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {item.category && (
                      <Badge
                        className={`absolute top-2 right-2 ${getCategoryBadgeColor(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </Badge>
                    )}
                    {item.status === "out-of-stock" && (
                      <Badge
                        variant="destructive"
                        className="absolute top-2 left-2"
                      >
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-1">
                      {item.name}
                    </CardTitle>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        ${item.price}
                      </span>
                      <Badge variant="secondary">Qty: {item.quantity}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {/* Item Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {renderStars(avgRating)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {avgRating > 0
                          ? `${avgRating} (${item.reviews?.length || 0})`
                          : "No reviews"}
                      </span>
                    </div>

                    {/* Seller Information */}
                    <div className="text-sm text-muted-foreground">
                      Seller:{" "}
                      <ClickableUserName
                        userData={item.postedBy}
                        className="text-foreground font-medium"
                      >
                        {item.postedBy?.fullName ||
                          item.postedBy?.username ||
                          "Unknown"}
                      </ClickableUserName>
                      {sellerRating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">
                            Seller: {sellerRating}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button className="w-full" variant="outline" asChild>
                      <Link to={`/item/${item._id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllItems;
