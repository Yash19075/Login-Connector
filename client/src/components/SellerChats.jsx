import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Axios } from "../lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, User, Clock } from "lucide-react";

const SellerChats = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [item, setItem] = useState(null);
  const [chatParticipants, setChatParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (itemId) {
      fetchItemAndChats();
    }
  }, [itemId]);

  const fetchItemAndChats = async () => {
    try {
      setLoading(true);

      // First fetch item details
      const itemResponse = await Axios.get(`/items/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (itemResponse.data && itemResponse.data.success) {
        const itemData = itemResponse.data.data;
        setItem(itemData);

        // Check if current user is the seller
        if (itemData.postedBy._id !== user._id) {
          setError("You can only view chats for your own items");
          return;
        }

        // Then fetch chat participants
        const chatsResponse = await Axios.get(`/chats/${itemId}/participants`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (chatsResponse.data && chatsResponse.data.success) {
          setChatParticipants(chatsResponse.data.data || []);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch chats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 border rounded"
                >
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
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
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Item
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {item?.picture && (
                <img
                  src={item.picture}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <CardTitle className="text-xl">
                  Private Chats for "{item?.name}"
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your private conversations with buyers
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chatParticipants.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Private Chats Yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  When buyers start private conversations about this item, they
                  will appear here.
                </p>
                <Button asChild variant="outline">
                  <Link to={`/item/${itemId}`}>View Item Details</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">
                    Active Conversations ({chatParticipants.length})
                  </h3>
                </div>

                {chatParticipants.map((participant, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={participant.user?.avatar} />
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">
                            {participant.user?.fullName ||
                              participant.user?.username ||
                              "Unknown User"}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {participant.user?.role || "Buyer"}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            Last message:{" "}
                            {participant.lastMessage || "No messages yet"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {participant.lastMessageAt
                                ? new Date(
                                    participant.lastMessageAt
                                  ).toLocaleDateString() +
                                  " " +
                                  new Date(
                                    participant.lastMessageAt
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "No recent activity"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {participant.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {participant.unreadCount} new
                        </Badge>
                      )}

                      <Button asChild size="sm">
                        <Link to={`/chats/${itemId}/${participant.user._id}`}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Open Chat
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerChats;
