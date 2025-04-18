"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AdminPanel() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cvText, setCvText] = useState("");
  const [urls, setUrls] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setIsAuthenticated(true);
        setError("");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Authentication failed");
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, urls: urls.split("\n").filter((url) => url.trim()) }),
      });
      if (response.ok) {
        setSuccess("Embeddings saved successfully");
        setCvText("");
        setUrls("");
      } else {
        setError("Failed to save embeddings");
      }
    } catch {
      setError("Error saving embeddings");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="mb-2"
        />
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <Button onClick={handleLogin}>Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-4 border rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Manage Embeddings</h2>
      <Textarea
        value={cvText}
        onChange={(e) => setCvText(e.target.value)}
        placeholder="Paste CV text here..."
        className="mb-2"
        rows={6}
      />
      <Textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="Enter URLs to crawl (one per line)"
        className="mb-2"
        rows={4}
      />
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-500 mb-2">{success}</p>}
      <Button onClick={handleSubmit}>Save Embeddings</Button>
    </div>
  );
}