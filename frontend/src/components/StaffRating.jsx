import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function StaffRating() {
  const [janitors, setJanitors] = useState({});
  const [avgRatings, setAvgRatings] = useState({});
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch janitors and average ratings
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const [dashboardRes, ratingRes] = await Promise.all([
          axios.get("http://localhost:3000/api/student/dashboard-student", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:3000/api/student/staff-ratings", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        console.log("Dashboard student API:", dashboardRes.data);
        // Janitors are in room.janitors, not directly in data.janitors
        const room = dashboardRes.data.room || {};
        setJanitors(room.janitors || {});
        setAvgRatings(ratingRes.data || {});
      } catch (err) {
        console.error("Error loading janitors/ratings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleRating = (janitorType, rating) =>
    setRatings(prev => ({ ...prev, [janitorType]: rating }));

  const submitRatings = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:3000/api/student/rate",
        { ratings },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Ratings submitted successfully!");
      setRatings({});
    } catch (err) {
      console.error("Error submitting ratings:", err);
      alert("Failed to submit ratings.");
    }
  };

  if (loading) return <p>Loading staff ratings...</p>;

  const janitorList = Object.entries(janitors);

  return (
    <Card className="shadow-md border rounded-lg bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-green-800">
          Rate Housekeeping Staff
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {janitorList.length === 0 ? (
          <p className="text-sm text-gray-500">No janitors assigned yet.</p>
        ) : (
          janitorList.map(([type, name]) => (
            <div
              key={type}
              className="flex items-center justify-between gap-6 pb-4 border-b last:border-0"
            >
              {/* Left: avatar + name */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-white text-sm font-bold">
                    {name
                      ?.split(" ")
                      .map(n => n[0])
                      .join("") || "NA"}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-medium text-gray-800">{name || "N/A"}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {type === "roomCleaner"
                      ? "Room Cleaner"
                      : type === "corridorCleaner"
                      ? "Corridor Cleaner"
                      : "Washroom Cleaner"}
                  </p>

                  {/* average rating */}
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-500">
                      {avgRatings[type] ? `${avgRatings[type]} avg` : "No ratings yet"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: rating stars */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      onClick={() => handleRating(type, i)}
                      className="transition hover:scale-105"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          i <= (ratings[type] || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Submit button */}
        {Object.keys(ratings).length > 0 && (
          <div className="pt-2 flex justify-end">
            <Button size="sm" onClick={submitRatings}>
              Submit All Ratings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
