import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Axios } from "../lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  ArrowLeft,
  Send,
  Edit,
  Trash2,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";

const ItemDetail = () => {
  const { itemId } = useParams();
  const { user, token } = useAuth();
  const [item, setItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchItemDetail();
    fetchMessages();
    fetchReviews();
  }, [itemId]);

  const fetchItemDetail = async () => {
    try {
      const response = await Axios.get(`/items/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setItem(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch item details");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await Axios.get(`/items/${itemId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setMessages(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await Axios.get(`/items/${itemId}/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        const reviewsData = response.data.data || [];
        setReviews(reviewsData);

        const myReview = reviewsData.find(
          (review) => review.reviewBy?._id === user?._id
        );
        if (myReview) {
          setUserReview(myReview);
          setReviewData({
            rating: myReview.rating,
            comment: myReview.comment || "",
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setError("");

    try {
      if (editingReview) {
        await Axios.put(`/items/${itemId}/review`, reviewData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await Axios.post(`/items/${itemId}/review`, reviewData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      setReviewData({ rating: 5, comment: "" });
      setEditingReview(false);
      fetchReviews();
      fetchItemDetail();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteReview = async () => {
    if (!confirm("Are you sure you want to delete your review?")) return;

    try {
      await Axios.delete(`/items/${itemId}/review`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUserReview(null);
      setReviewData({ rating: 5, comment: "" });
      setEditingReview(false);
      fetchReviews();
      fetchItemDetail();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete review");
    }
  };

  const startEditing = () => {
    setEditingReview(true);
    setReviewData({
      rating: userReview.rating,
      comment: userReview.comment || "",
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSendingMessage(true);
    try {
      const response = await Axios.post(
        `/items/${itemId}/message`,
        { message: messageText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        setMessageText("");
        fetchMessages();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
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

  const renderStarInput = (currentRating) => {
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className="p-1 hover:scale-110 transition-transform"
          onClick={() => setReviewData((prev) => ({ ...prev, rating: i }))}
        >
          <Star
            className={`w-6 h-6 ${
              i <= currentRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-400"
            }`}
          />
        </button>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="ml-2 text-sm text-muted-foreground">
          {currentRating} out of 5 stars
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error || "Item not found"}</AlertDescription>
            </Alert>
            <Button asChild>
              <Link to="/all-items">Back to Items</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avgRating = getAverageRating(reviews);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/all-items">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Items
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={item.picture}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold mb-4">{item.name}</h1>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-primary">
                    ${item.price}
                  </span>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      Qty: {item.quantity}
                    </Badge>
                    <Badge
                      variant={
                        item.status === "in-stock"
                          ? "default"
                          : item.status === "out-of-stock"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-lg px-3 py-1"
                    >
                      {item.status === "in-stock"
                        ? "In Stock"
                        : item.status === "out-of-stock"
                        ? "Out of Stock"
                        : "Available"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {renderStars(avgRating)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {avgRating > 0
                      ? `${avgRating} (${reviews.length} reviews)`
                      : "No reviews yet"}
                  </span>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <h3 className="font-semibold">Seller Information</h3>
                  <p className="text-muted-foreground">
                    {item.postedBy?.fullName ||
                      item.postedBy?.username ||
                      "Unknown Seller"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Role: {item.postedBy?.role || "Seller"}
                  </p>
                </div>

                {/* Action buttons - Edit or Buy */}
                {user?._id === item?.postedBy?._id ? (
                  <div className="mt-4">
                    <Button asChild className="w-full">
                      <Link to={`/item/${itemId}/update`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Item
                      </Link>
                    </Button>
                  </div>
                ) : (
                  item?.quantity > 0 &&
                  item?.status !== "out-of-stock" && (
                    <div className="mt-4">
                      <Button asChild className="w-full" size="lg">
                        <Link to={`/items/${itemId}/buy`}>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy Now - ${item.price}
                        </Link>
                      </Button>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Review Section */}
            {user?._id !== item?.postedBy?._id && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {userReview
                      ? editingReview
                        ? "Edit Your Review"
                        : "Your Review"
                      : "Write a Review"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userReview && !editingReview ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {renderStars(userReview.rating)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Your rating
                        </span>
                      </div>
                      {userReview.comment && (
                        <p className="text-sm">{userReview.comment}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={startEditing}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deleteReview}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={submitReview} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Rating</label>
                        {renderStarInput(reviewData.rating)}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Comment (optional)
                        </label>
                        <Textarea
                          value={reviewData.comment}
                          onChange={(e) =>
                            setReviewData((prev) => ({
                              ...prev,
                              comment: e.target.value,
                            }))
                          }
                          placeholder="Share your experience with this item..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={submittingReview}>
                          {submittingReview
                            ? editingReview
                              ? "Updating..."
                              : "Submitting..."
                            : editingReview
                            ? "Update Review"
                            : "Submit Review"}
                        </Button>
                        {editingReview && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingReview(false);
                              setReviewData({
                                rating: userReview.rating,
                                comment: userReview.comment || "",
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Messages Section with Private Chat Integration */}
            <Card className="flex flex-col h-96">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle>Public Messages</CardTitle>
                  {user?._id !== item?.postedBy?._id && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/chats/${itemId}/${item.postedBy._id}`}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Private Chat
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 border rounded min-h-0 max-h-64">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        {user?._id === item?.postedBy?._id
                          ? "No public messages yet from buyers."
                          : "Start a conversation with the seller!"}
                      </p>
                      {user?._id !== item?.postedBy?._id && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Choose between:
                          </p>
                          <div className="flex flex-col gap-2 items-center">
                            <span className="text-xs bg-muted px-3 py-1 rounded">
                              Public messages (visible to everyone)
                            </span>
                            <span className="text-xs bg-primary/10 px-3 py-1 rounded">
                              Private chat (only between you and seller)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg max-w-xs break-words ${
                            msg.sentBy?._id === user?._id
                              ? "bg-primary text-primary-foreground ml-auto"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.sentBy?.fullName ||
                              msg.sentBy?.username ||
                              "Unknown"}
                          </p>
                          <p className="text-xs opacity-50">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {user?._id !== item?.postedBy?._id ? (
                  <div className="space-y-2">
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your public message..."
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={sendingMessage || !messageText.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                    <p className="text-xs text-muted-foreground text-center">
                      This message will be visible to everyone viewing this item
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center p-2 bg-muted rounded">
                      This is your item. Buyers can message you here.
                    </p>
                    {user?._id === item?.postedBy?._id && (
                      <div className="text-center">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/seller-chats/${itemId}`}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            View Private Chats
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews Display */}
            {reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>All Reviews ({reviews.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {reviews.map((review, index) => (
                    <div
                      key={index}
                      className="border-b last:border-b-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          {renderStars(review.rating)}
                        </div>
                        <span className="font-medium text-sm">
                          {review.reviewBy?.fullName ||
                            review.reviewBy?.username ||
                            "Anonymous"}
                        </span>
                        {review.reviewBy?._id === user?._id && (
                          <Badge variant="secondary" className="text-xs">
                            Your review
                          </Badge>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {review.comment}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
