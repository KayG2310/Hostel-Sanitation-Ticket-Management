import React from "react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Calendar, MapPin, User } from "lucide-react";
import AIConfidenceBadge from "./AIConfidenceBadge";

export default function TicketCard({ ticket, onClick }) {
  // Normalize backend statuses to the ones this card knows how to style.
  const statusForColor =
    ticket.status === "open"
      ? "pending"
      : ticket.status === "resolved_pending"
        ? "resolved"
        : ticket.status;

  const statusForLabel =
    ticket.status === "open" ? "pending" : ticket.status;

  const floorSelected = ticket.floorSelected ?? ticket.floor ?? "-";
  const locationSelected = ticket.locationSelected ?? null;

  const getStatusColor = () => {
    switch (statusForColor) {
      case "pending":
        return "bg-status-pending text-status-pending-foreground";
      case "in-progress":
        return "bg-status-in-progress text-status-in-progress-foreground";
      case "resolved":
      default:
        return "bg-status-resolved text-status-resolved-foreground";
    }
  };

  const statusLabel = (statusForLabel || "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .toUpperCase();

  return (
    <Card
      className={`w-full hover-elevate cursor-pointer relative overflow-hidden border-l-4 ${
        statusForColor === "pending" ? "border-l-4 ${ticket.aiConfidence > 75? \"border-l-red-500\": ticket.aiConfidence > 50? \"border-l-yellow-500\": \"border-l-green-500\"}" :
        statusForColor === "in-progress" ? "border-l-status-in-progress" :
        "border-l-status-resolved"
      }`}
      onClick={onClick}
      data-testid={`card-ticket-${ticket.id}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3 space-y-0">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base" data-testid="text-ticket-issue">
              {ticket.title}
            </h3>
            <Badge className={getStatusColor()} data-testid="badge-ticket-status">
              {statusLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Room {ticket.roomNumber}
            </span>

            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
              Floor {floorSelected}
            </span>

            {locationSelected && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                Location: {locationSelected}
              </span>
            )}

            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {ticket.submittedAt}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-foreground line-clamp-2">{ticket.description}</p>

        {ticket.photoUrl && (
          <img
            src={ticket.photoUrl}
            alt="Issue evidence"
            loading="lazy"
            className="w-full h-48 object-cover rounded-lg border border-gray-200 bg-gray-50"
            data-testid="img-ticket-photo"
          />
        )}

        {ticket.aiConfidence !== undefined && (
          <AIConfidenceBadge confidence={ticket.aiConfidence} isClean={ticket.aiConfidence <= 20} />
        )}

        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            {ticket.submittedBy}
          </span>
          {ticket.assignedTo && (
            <span className="text-muted-foreground">
              Assigned to: <span className="text-foreground font-medium">{ticket.assignedTo}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}