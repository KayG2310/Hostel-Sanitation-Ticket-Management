import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, User } from "lucide-react";

export default function CleaningStatusMarker({ roomNumber, lastCleaned, caretaker, complianceScore, onMarkClean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Room Status</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Room Number:</p>
          <p className="font-semibold text-lg"> {roomNumber || "N/A"}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Last Cleaned:</p>
          <p className="font-medium">{lastCleaned ? new Date(lastCleaned).toLocaleString() : "Not yet cleaned"}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Assigned Caretaker:</p>
          <p className="font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {caretaker || "Unassigned"}
          </p>
        </div>

        {complianceScore !== undefined && (
          <div>
            <p className="text-sm text-muted-foreground">Compliance Score</p>
            <div className="inline-flex items-center gap-2 mt-1">
              <div className="h-8 w-8 rounded-full bg-status-resolved flex items-center justify-center">
                <span className="text-xs text-white font-bold">{Math.round(complianceScore)}</span>
              </div>
              <div className="text-sm font-medium">Overall</div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button onClick={onMarkClean} variant="outline">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark as Clean
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}