import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Camera, Upload } from "lucide-react";
import AIConfidenceBadge from "./AIConfidenceBadge";

export default function TicketSubmissionForm({ roomNumber, onSubmit }) {
  const [issue, setIssue] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
    //   setTimeout(() => {
    //     const mockConfidence = Math.floor(Math.random() * 40) + 60;
    //     setAiAnalysis({ confidence: mockConfidence, isClean: mockConfidence >= 80 });
    //   }, 800);
    };
    reader.readAsDataURL(file);
  };

  const submit = async(e) => {
    e.preventDefault();
    try {
        const form = new FormData();
        form.append("title", issue);
        form.append("description", description);
        form.append("roomNumber", roomNumber);
        if (photoFile) { // store the File object in state as photoFile when user selects file
          form.append("photo", photoFile);
        }
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/tickets/create`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        // DO NOT set Content-Type; browser will set boundary for multipart
        },
        body: form,
        });
        if (!res.ok) throw new Error("Failed to submit ticket");
        const data = await res.json();
        if (onSubmit) onSubmit(data.ticket || data);
        // reset local UI
        setIssue("");
        setDescription("");
        setPhoto(null);
        setPhotoFile(null);
        } catch (err) {
        console.error("Ticket submit error", err);
        alert("Failed to submit ticket.");
        }
    };


    // const payload = {
    //   title: issue,
    //   description,
    //   roomNumber,
    //   photo,
    // };
    // if (onSubmit) {
    //   onSubmit(payload);
    // } else {
    //   // fallback: simple toast UX (replace with your hook if available)
    //   alert("Ticket submitted (demo).");
    // }
    // setIssue("");
    // setDescription("");
    // setPhoto(null);
    // setAiAnalysis(null);
//   };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Report Sanitation Issue</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issue">Issue Title</Label>
            <Input id="issue" value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="e.g., Bathroom not cleaned" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue..." rows={4} required />
          </div>

          <div className="space-y-2">
            <Label>Upload Photo Evidence</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover-elevate">
              {photo ? (
                <div className="space-y-3">
                  <img src={photo} alt="Evidence" className="mx-auto h-48 w-full object-cover rounded-md" />
                  {aiAnalysis && <AIConfidenceBadge confidence={aiAnalysis.confidence} isClean={aiAnalysis.isClean} />}
                  <Button type="button" variant="outline" size="sm" onClick={() => { setPhoto(null); setAiAnalysis(null); }}>
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload photo</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Submit Ticket
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}