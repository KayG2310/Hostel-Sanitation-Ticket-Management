import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const staffMembers = [
  { id: "1", name: "Ramesh Kumar", role: "Floor 1 Caretaker", currentRating: 4.5 },
  { id: "2", name: "Priya Sharma", role: "Floor 2 Caretaker", currentRating: 4.8 },
  { id: "3", name: "Amit Patel", role: "Floor 3 Caretaker", currentRating: 4.2 },
];

export default function StaffRating({ onSubmitRating }) {
  const [ratings, setRatings] = useState({});

  const handleRating = (staffId, rating) => setRatings(prev => ({ ...prev, [staffId]: rating }));

  const submit = (staffId) => {
    if (onSubmitRating) onSubmitRating(staffId, ratings[staffId]);
    alert("Rating submitted (demo). Thank you!");
    setRatings(prev => ({ ...prev, [staffId]: 0 }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Housekeeping Staff</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {staffMembers.map(staff => (
          <div key={staff.id} className="flex items-center justify-between gap-4 pb-4 border-b last:border-0">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {staff.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{staff.name}</p>
                <p className="text-sm text-muted-foreground">{staff.role}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">{staff.currentRating} avg</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <button key={i} onClick={() => handleRating(staff.id, i)} className="hover-elevate rounded-sm">
                    <Star className={`h-5 w-5 ${i <= (ratings[staff.id] || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              {ratings[staff.id] > 0 && (
                <Button size="sm" onClick={() => submit(staff.id)}>Submit</Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
