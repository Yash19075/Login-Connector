import React, { useState, useEffect } from "react";
import {
  Mail,
  User,
  Shield,
  Star,
  MessageSquare,
  Calendar,
  Image,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "../context/AuthContext";
import { Axios } from "../lib/axios";

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [reviewsWritten, setReviewsWritten] = useState([]);
  const [reviewsReceived, setReviewsReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("written");

  useEffect(() => {
    fetchUserProfile();
    fetchUserReviews();
    fetchReceivedReviews();
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log("Fetching user profile...");
      setLoading(true);
      const response = await Axios.get("/users/me");
      console.log("Profile response:", response.data);

      // Handle nested data structure
      const userData = response.data?.data || response.data;
      console.log("User data extracted:", userData);

      setUser(userData);
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const response = await Axios.get("/users/reviews");
      const reviewsData = response.data?.data || response.data;
      setReviewsWritten(reviewsData);
    } catch (err) {
      console.error("User reviews fetch error:", err);
    }
  };

  const fetchReceivedReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await Axios.get("/users/received-reviews");
      const reviewsData = response.data?.data || response.data;
      setReviewsReceived(reviewsData);
    } catch (err) {
      console.error("Received reviews fetch error:", err);
    } finally {
      setReviewsLoading(false);
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

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${
              index < rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating}/5)</span>
      </div>
    );
  };

  const ReviewCard = ({ review, type }) => (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Item Info */}
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {review.item.picture ? (
            <img
              src={review.item.picture}
              alt={review.item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{review.item.name}</h4>
          {type === "written" ? (
            <p className="text-sm text-muted-foreground">
              by @{review.item.postedBy.username}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              by @{review.reviewBy.username}
            </p>
          )}
          <p className="text-sm font-medium text-green-600">
            ${review.item.price}
          </p>
        </div>
      </div>

      {/* Review Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {renderStars(review.rating)}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(review.createdAt).toLocaleDateString()}
          </div>
        </div>

        {review.comment && (
          <p className="text-sm text-gray-700 bg-muted/30 p-3 rounded-md">
            "{review.comment}"
          </p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load user profile. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar} alt={user.fullName} />
                  <AvatarFallback className="text-lg">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">{user.fullName}</h2>
                <p className="text-muted-foreground">@{user.username}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  {user.role === "seller" && user.averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {user.averageRating} ({user.totalRatings} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Full Name
                </Label>
                <div className="p-3 border rounded-md bg-muted/50">
                  {user.fullName}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Username
                </Label>
                <div className="p-3 border rounded-md bg-muted/50">
                  @{user.username}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Email
                </Label>
                <div className="p-3 border rounded-md bg-muted/50 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seller Rating Card - Only show for sellers */}
        {user.role === "seller" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Seller Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.averageRating > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className={`h-6 w-6 ${
                              index < Math.round(user.averageRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <div>
                        <span className="text-2xl font-bold">
                          {user.averageRating}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          out of 5
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{user.totalRatings}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.totalRatings === 1 ? "Review" : "Reviews"}
                      </p>
                    </div>
                  </div>

                  {user.ratings && user.ratings.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Recent Ratings:</h4>
                      <div className="space-y-2">
                        {user.ratings.slice(0, 3).map((rating) => (
                          <div
                            key={rating._id}
                            className="flex items-center justify-between p-3 border rounded-md"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {getInitials(rating.ratedBy.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {rating.ratedBy.fullName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  @{rating.ratedBy.username}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, index) => (
                                  <Star
                                    key={index}
                                    className={`h-4 w-4 ${
                                      index < rating.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(
                                  rating.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                        {user.ratings.length > 3 && (
                          <p className="text-sm text-muted-foreground text-center">
                            and {user.ratings.length - 3} more ratings...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No ratings yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    When buyers rate your items, your rating will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Member Since
                </Label>
                <p className="mt-1">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </Label>
                <p className="mt-1">
                  {new Date(user.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("written")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "written"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Written by Me
                <Badge variant="secondary" className="ml-2">
                  {reviewsWritten.length}
                </Badge>
              </button>
              <button
                onClick={() => setActiveTab("received")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "received"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Received Reviews
                <Badge variant="secondary" className="ml-2">
                  {reviewsReceived.length}
                </Badge>
              </button>
            </div>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div>
                {/* Written Reviews Tab */}
                {activeTab === "written" && (
                  <div className="space-y-4">
                    {reviewsWritten.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No reviews written yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Start reviewing items to see them here
                        </p>
                      </div>
                    ) : (
                      reviewsWritten.map((review) => (
                        <ReviewCard
                          key={review._id}
                          review={review}
                          type="written"
                        />
                      ))
                    )}
                  </div>
                )}

                {/* Received Reviews Tab */}
                {activeTab === "received" && (
                  <div className="space-y-4">
                    {reviewsReceived.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          {user.role === "seller"
                            ? "No reviews received yet"
                            : "Only sellers receive reviews"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {user.role === "seller"
                            ? "When buyers review your items, they'll appear here"
                            : "Switch to seller role to receive reviews on your items"}
                        </p>
                      </div>
                    ) : (
                      reviewsReceived.map((review) => (
                        <ReviewCard
                          key={review._id}
                          review={review}
                          type="received"
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
