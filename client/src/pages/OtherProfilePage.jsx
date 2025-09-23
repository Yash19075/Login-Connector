import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  Star,
  Calendar,
  Image,
  Package,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "../context/AuthContext";
import { Axios } from "../lib/axios";

const OtherProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    console.log("useEffect triggered with userId:", userId);
    if (!userId) {
      console.log("No userId provided");
      return;
    }
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      console.log("Fetching profile for userId:", userId);
      setLoading(true);
      setError(null);
      const response = await Axios.get(`/users/${userId}`);

      console.log("Full API Response:", response);
      console.log("Response data:", response.data);

      // Handle the nested data structure from your API
      const profileData = response.data?.data || response.data;

      console.log("Profile data extracted:", profileData);

      if (!profileData) {
        throw new Error("No profile data received");
      }

      setUserProfile(profileData);

      // Check for existing rating
      if (profileData.ratings && authUser?._id) {
        console.log("Checking ratings:", profileData.ratings);
        console.log("Auth user ID:", authUser._id);

        const existingRating = profileData.ratings.find(
          (rating) => rating.ratedBy._id === authUser._id
        );

        console.log("Existing rating found:", existingRating);

        if (existingRating) {
          setHasRated(true);
          setSelectedRating(existingRating.rating);
        }
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      console.error("Error response:", err.response?.data);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load user profile"
      );
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRateUser = async (rating) => {
    if (ratingLoading) return;

    try {
      console.log("Rating user with:", rating);
      setRatingLoading(true);
      setError(null);

      const response = await Axios.post(`/users/${userId}/rate`, { rating });
      console.log("Rating response:", response);

      setSelectedRating(rating);
      setHasRated(true);
      await fetchUserProfile();
    } catch (err) {
      console.error("Rating error:", err);
      setError(err.response?.data?.message || "Failed to rate user");
    } finally {
      setRatingLoading(false);
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

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => (
          <button
            key={index}
            onClick={() => interactive && onStarClick && onStarClick(index + 1)}
            disabled={!interactive || ratingLoading}
            className={`${
              interactive
                ? "hover:scale-110 transition-transform cursor-pointer disabled:cursor-not-allowed"
                : ""
            }`}
          >
            <Star
              className={`h-5 w-5 ${
                index < rating
                  ? "fill-yellow-400 text-yellow-400"
                  : interactive
                  ? "text-gray-300 hover:text-yellow-300"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
        {!interactive && (
          <span className="ml-2 text-sm text-muted-foreground">
            ({rating}/5)
          </span>
        )}
      </div>
    );
  };

  // Debug logging
  console.log("Render state:", {
    loading,
    userProfile,
    error,
    userId,
    authUser: authUser?._id,
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="ml-4">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error && !userProfile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>Error: {error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={fetchUserProfile} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Add additional safety check
  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>
            No user profile data available. User ID: {userId}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={fetchUserProfile} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">User Profile</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={userProfile.avatar}
                    alt={userProfile.fullName}
                  />
                  <AvatarFallback className="text-lg">
                    {getInitials(userProfile.fullName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">
                  {userProfile.fullName}
                </h2>
                <p className="text-muted-foreground">@{userProfile.username}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Badge className={getRoleBadgeColor(userProfile.role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {userProfile.role.charAt(0).toUpperCase() +
                      userProfile.role.slice(1)}
                  </Badge>
                  {userProfile.averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {userProfile.averageRating} ({userProfile.totalRatings}{" "}
                        reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Full Name
                </Label>
                <div className="p-3 border rounded-md bg-muted/50">
                  {userProfile.fullName}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Username
                </Label>
                <div className="p-3 border rounded-md bg-muted/50">
                  @{userProfile.username}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Member Since
                </Label>
                <div className="p-3 border rounded-md bg-muted/50 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(userProfile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Role
                </Label>
                <div className="p-3 border rounded-md bg-muted/50">
                  {userProfile.role.charAt(0).toUpperCase() +
                    userProfile.role.slice(1)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {userProfile.role === "seller" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Rate This Seller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {hasRated ? "Your Rating:" : "Rate this seller:"}
                </Label>
                {renderStars(
                  selectedRating,
                  !hasRated,
                  !hasRated ? handleRateUser : null
                )}
                {hasRated && (
                  <p className="text-sm text-muted-foreground">
                    You have rated this seller {selectedRating} out of 5 stars.
                  </p>
                )}
                {ratingLoading && (
                  <p className="text-sm text-muted-foreground">
                    Submitting your rating...
                  </p>
                )}
              </div>

              {userProfile.averageRating > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Rating:</span>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {userProfile.averageRating}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({userProfile.totalRatings} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {userProfile.postedItems && userProfile.postedItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Items
                <Badge variant="secondary">
                  {userProfile.postedItems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userProfile.postedItems.map((item) => (
                  <div
                    key={item._id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="w-full h-32 rounded-md overflow-hidden bg-muted">
                      {item.picture ? (
                        <img
                          src={item.picture}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-sm truncate">
                      {item.name}
                    </h4>
                    <p className="text-sm font-medium text-green-600">
                      ${item.price}
                    </p>
                    {item.category && (
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Posted {new Date(item.createdAt).toLocaleDateString()}
                    </p>
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
