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
import {
  ArrowRight,
  ShoppingCart,
  DollarSign,
  Package,
  Star,
  CheckCircle,
  Github,
  Twitter,
  Linkedin,
  TrendingUp,
  Users,
  Award,
  Clock,
  Eye,
  MessageSquare,
  Heart,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

function Home() {
  const { user } = useAuth();
  const [featuredItems, setFeaturedItems] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [topRatedItems, setTopRatedItems] = useState([]);
  const [userStats, setUserStats] = useState({
    totalItems: 0,
    totalSellers: 0,
    totalBuyers: 0,
    avgRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userActivity, setUserActivity] = useState({
    reviewsWritten: [],
    reviewsReceived: [],
  });

  useEffect(() => {
    if (user) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchItems(), fetchUserActivity()]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await Axios.get("/items/getallItems", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success && response.data.data) {
        const items = response.data.data;

        // Calculate stats
        const sellers = new Set(items.map((item) => item.postedBy?._id)).size;
        const totalRatings = items.reduce((acc, item) => {
          const itemAvg = getAverageRating(item.reviews);
          return itemAvg > 0 ? acc + itemAvg : acc;
        }, 0);
        const itemsWithRatingsCount = items.filter(
          (item) => getAverageRating(item.reviews) > 0
        ).length;

        setUserStats({
          totalItems: items.length,
          totalSellers: sellers,
          totalBuyers: sellers * 2, // Estimate
          avgRating:
            itemsWithRatingsCount > 0
              ? (totalRatings / itemsWithRatingsCount).toFixed(1)
              : 0,
        });

        // Featured items (top 4 with highest ratings)
        const ratedItems = items
          .map((item) => ({
            ...item,
            avgRating: getAverageRating(item.reviews),
          }))
          .filter((item) => item.avgRating > 0)
          .sort((a, b) => b.avgRating - a.avgRating);

        setFeaturedItems(ratedItems.slice(0, 4));

        // Recent items (latest 6)
        const sortedByDate = [...items].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setRecentItems(sortedByDate.slice(0, 6));

        // Top rated items with at least 2 reviews
        const topRated = ratedItems
          .filter((item) => item.reviews?.length >= 2)
          .slice(0, 8);
        setTopRatedItems(topRated);
      }
    } catch (err) {
      console.error("Error fetching items:", err);
      throw err;
    }
  };

  const fetchUserActivity = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("accessToken");
      const [reviewsWritten, reviewsReceived] = await Promise.all([
        Axios.get("/users/reviews", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        Axios.get("/users/reviews/received", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setUserActivity({
        reviewsWritten: reviewsWritten.data?.data || [],
        reviewsReceived: reviewsReceived.data?.data || [],
      });
    } catch (err) {
      console.error("Error fetching user activity:", err);
    }
  };

  const getAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  };

  const renderStars = (rating, size = "w-4 h-4") => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className={`${size} fill-yellow-400 text-yellow-400`} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            className={`${size} fill-yellow-400/50 text-yellow-400`}
          />
        );
      } else {
        stars.push(<Star key={i} className={`${size} text-gray-300`} />);
      }
    }
    return stars;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const ItemCard = ({ item, showBadge = true }) => {
    const avgRating = getAverageRating(item.reviews);

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <div className="relative">
          <img
            src={item.picture || "/api/placeholder/300/200"}
            alt={item.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {showBadge && avgRating > 4 && (
            <Badge className="absolute top-2 right-2 bg-green-500 text-white">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Top Rated
            </Badge>
          )}
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-1">{item.name}</CardTitle>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              ${item.price}
            </span>
            <Badge variant="outline" className="text-xs">
              Qty: {item.quantity}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              {renderStars(avgRating)}
              <span className="text-sm text-muted-foreground ml-1">
                {avgRating > 0 ? `${avgRating.toFixed(1)}` : "No ratings"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({item.reviews?.length || 0} reviews)
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>By: {item.postedBy?.fullName || "Unknown"}</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {item.chat?.length || 0}
            </span>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button className="w-full" asChild>
            <Link to={`/item/${item._id}`}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Guest Hero Section */}
          <section className="relative overflow-hidden bg-white">
            <div className="relative container mx-auto px-4 py-20 lg:py-32">
              <div className="text-center max-w-4xl mx-auto">
                <Badge variant="secondary" className="mb-4 px-3 py-1">
                  🎉 Join Our Marketplace Community
                </Badge>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                  Buy & Sell
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {" "}
                    Anything
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                  Connect with sellers and buyers in your area. List items,
                  leave reviews, and build your reputation.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="lg" asChild className="px-8 py-6 text-lg">
                    <Link to="/login">
                      Sign In to Explore
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="px-8 py-6 text-lg"
                  >
                    <Link to="/signup">Create Account</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Authenticated Hero Section */}
        <section className="relative overflow-hidden bg-card">
          <div className="relative container mx-auto px-4 py-16">
            <div className="text-center max-w-4xl mx-auto">
              <Badge variant="secondary" className="mb-4 px-3 py-1">
                👋 Welcome back, {user?.fullName}!
              </Badge>

              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                Your Marketplace
                <span className="text-primary"> Dashboard</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                Discover amazing items, connect with sellers, and grow your
                business.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button size="lg" asChild>
                  <Link to="/all-items">
                    <Package className="mr-2 w-5 h-5" />
                    Browse All Items
                  </Link>
                </Button>
                {user?.role === "seller" && (
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/create-item">
                      <DollarSign className="mr-2 w-5 h-5" />
                      List New Item
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-card border-t">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Package className="w-8 h-8 text-primary mr-2" />
                  <span className="text-3xl font-bold text-foreground">
                    {userStats.totalItems}
                  </span>
                </div>
                <div className="text-muted-foreground">Total Items</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-8 h-8 text-primary mr-2" />
                  <span className="text-3xl font-bold text-foreground">
                    {userStats.totalSellers}
                  </span>
                </div>
                <div className="text-muted-foreground">Active Sellers</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-8 h-8 text-primary mr-2" />
                  <span className="text-3xl font-bold text-foreground">
                    {userStats.avgRating}
                  </span>
                </div>
                <div className="text-muted-foreground">Avg Rating</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-8 h-8 text-primary mr-2" />
                  <span className="text-3xl font-bold text-foreground">
                    24/7
                  </span>
                </div>
                <div className="text-muted-foreground">Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* User Activity Section */}
        {user &&
          (userActivity.reviewsWritten.length > 0 ||
            userActivity.reviewsReceived.length > 0) && (
            <section className="py-16 bg-muted/50">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
                  Your Activity
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Reviews Written */}
                  {userActivity.reviewsWritten.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Award className="w-5 h-5 mr-2 text-primary" />
                          Reviews You've Written (
                          {userActivity.reviewsWritten.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4 max-h-64 overflow-y-auto">
                          {userActivity.reviewsWritten
                            .slice(0, 3)
                            .map((review, index) => (
                              <div
                                key={index}
                                className="border-b pb-3 last:border-b-0"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Link
                                      to={`/item/${review.item._id}`}
                                      className="font-medium hover:text-primary transition-colors"
                                    >
                                      {review.item.name}
                                    </Link>
                                    <div className="flex items-center mt-1">
                                      {renderStars(review.rating)}
                                      <span className="text-sm text-muted-foreground ml-2">
                                        {formatDate(review.createdAt)}
                                      </span>
                                    </div>
                                    {review.comment && (
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {review.comment}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                        {userActivity.reviewsWritten.length > 3 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-4"
                            asChild
                          >
                            <Link to="/profile">View All Reviews</Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Reviews Received */}
                  {userActivity.reviewsReceived.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Heart className="w-5 h-5 mr-2 text-primary" />
                          Reviews You've Received (
                          {userActivity.reviewsReceived.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4 max-h-64 overflow-y-auto">
                          {userActivity.reviewsReceived
                            .slice(0, 3)
                            .map((review, index) => (
                              <div
                                key={index}
                                className="border-b pb-3 last:border-b-0"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Link
                                      to={`/item/${review.item._id}`}
                                      className="font-medium hover:text-primary transition-colors"
                                    >
                                      {review.item.name}
                                    </Link>
                                    <div className="flex items-center justify-between mt-1">
                                      <div className="flex items-center">
                                        {renderStars(review.rating)}
                                        <span className="text-sm text-muted-foreground ml-2">
                                          by {review.reviewBy.fullName}
                                        </span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(review.createdAt)}
                                      </span>
                                    </div>
                                    {review.comment && (
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {review.comment}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                        {userActivity.reviewsReceived.length > 3 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-4"
                            asChild
                          >
                            <Link to="/profile">View All Received Reviews</Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </section>
          )}

        {/* Featured Items Section */}
        <section className="py-20 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                <TrendingUp className="w-4 h-4 mr-1" />
                Top Rated
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Featured Items
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover the highest-rated items from our community of sellers.
              </p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="w-full h-48" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Alert variant="destructive" className="mx-auto max-w-lg">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : featuredItems.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredItems.map((item) => (
                  <ItemCard key={item._id} item={item} showBadge={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  No featured items available at the moment.
                </p>
                {user?.role === "seller" && (
                  <Button className="mt-4" asChild>
                    <Link to="/create-item">List Your First Item</Link>
                  </Button>
                )}
              </div>
            )}

            {featuredItems.length > 0 && (
              <div className="text-center mt-12">
                <Button size="lg" variant="outline" asChild>
                  <Link to="/all-items">
                    View All Items
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Recent Items Section */}
        {recentItems.length > 0 && (
          <section className="py-20 bg-muted/50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <Badge variant="outline" className="mb-4">
                  <Clock className="w-4 h-4 mr-1" />
                  Just Listed
                </Badge>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Recently Added Items
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Check out the latest additions to our marketplace.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recentItems.map((item) => (
                  <ItemCard key={item._id} item={item} showBadge={false} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {user?.role === "seller"
                ? "Grow Your Business"
                : "Ready to Start Selling?"}
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              {user?.role === "seller"
                ? "List more items and reach thousands of potential buyers in your area."
                : "Join our community of sellers and turn your items into income today!"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                variant="secondary"
                className="px-8 py-6 text-lg"
              >
                <Link to="/create-item">
                  <DollarSign className="mr-2 w-5 h-5" />
                  {user?.role === "seller" ? "List New Item" : "Start Selling"}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
