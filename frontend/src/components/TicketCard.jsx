import React from "react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Calendar, MapPin, User } from "lucide-react";
import AIConfidenceBadge from "./AIConfidenceBadge";

export default function TicketCard({ ticket, onClick }) {
  const getStatusColor = () => {
    switch (ticket.status) {
      case "pending":
        return "bg-status-pending text-status-pending-foreground";
      case "in-progress":
        return "bg-status-in-progress text-status-in-progress-foreground";
      case "resolved":
      default:
        return "bg-status-resolved text-status-resolved-foreground";
    }
  };

  const statusLabel = (ticket.status || "").replace("-", " ").toUpperCase();

  return (
    <Card
      className={`hover-elevate cursor-pointer relative overflow-hidden border-l-4 ${
        ticket.status === "pending" ? "border-l-status-pending" :
        ticket.status === "in-progress" ? "border-l-status-in-progress" :
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

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Room {ticket.roomNumber}, Floor {ticket.floor}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {ticket.submittedAt}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-foreground">{ticket.description}</p>

        {ticket.photoUrl && (
          <img
            src={ticket.photoUrl}
            alt="Issue evidence"
            className="w-full h-40 object-cover rounded-md"
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