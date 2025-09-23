import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mail, User, Shield, Star, Calendar, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "../context/AuthContext";
import { Axios } from "../lib/axios";

const OtherProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await Axios.get(`/users/${userId}`);
      setUser(response.data.data);
    } catch (err) {
      setError("Failed to load user profile");
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRateUser = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    try {
      setIsRating(true);
      setError(null);

      await Axios.post(`/users/${userId}/rate`, {
        rating: rating,
      });

      setRatingSuccess(true);
      setRating(0);
      // Refresh user data to show updated rating
      fetchUserProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to rate user");
      console.error("Rating error:", err);
    } finally {
      setIsRating(false);
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

  const calculateAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const renderStars = (
    rating,
    interactive = false,
    onHover = null,
    onClick = null
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          const isActive = interactive
            ? (hoveredRating || rating) >= starValue
            : starValue <= rating;

          return (
            <Star
              key={index}
              className={`h-5 w-5 cursor-pointer transition-colors ${
                isActive
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-400"
              }`}
              onMouseEnter={() => interactive && onHover && onHover(starValue)}
              onMouseLeave={() => interactive && onHover && onHover(0)}
              onClick={() => interactive && onClick && onClick(starValue)}
            />
          );
        })}
        {!interactive && (
          <span className="ml-2 text-sm text-muted-foreground">
            ({rating}/5)
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate(-1)} className="mt-4" variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>User not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const averageRating = calculateAverageRating(user.ratings);
  const hasAlreadyRated = user.ratings?.some(
    (rate) => rate.ratedBy._id === authUser?._id
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate(-1)} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">User Profile</h1>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {ratingSuccess && (
          <Alert>
            <AlertDescription>
              User rated successfully! Thank you for your feedback.
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
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
                  {averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {averageRating}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({user.ratings?.length || 0} reviews)
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

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Member Since
                </Label>
                <div className="p-3 border rounded-md bg-muted/50 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  User Role
                </Label>
                <div className="p-3 border rounded-md bg-muted/50">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating Section */}
        {authUser && authUser._id !== user._id && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StarIcon className="h-5 w-5" />
                Rate This User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasAlreadyRated ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    You have already rated this user.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Your Rating</Label>
                    {renderStars(rating, true, setHoveredRating, setRating)}
                    <p className="text-xs text-muted-foreground">
                      Click on the stars to rate this user (1-5 stars)
                    </p>
                  </div>

                  <Button
                    onClick={handleRateUser}
                    disabled={rating === 0 || isRating}
                    className="w-full"
                  >
                    {isRating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting Rating...
                      </>
                    ) : (
                      "Submit Rating"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Ratings Display */}
        {user.ratings && user.ratings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                User Reviews
                <Badge variant="secondary">{user.ratings.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.ratings.map((ratingItem, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ratingItem.ratedBy?.avatar} />
                          <AvatarFallback>
                            {getInitials(ratingItem.ratedBy?.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {ratingItem.ratedBy?.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{ratingItem.ratedBy?.username}
                          </p>
                        </div>
                      </div>
                      {renderStars(ratingItem.rating)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OtherProfilePage;
