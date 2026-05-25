"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminUpgradePage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processing, setProcessing] = useState(false);

  // Redirect if not admin or not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setProcessing(true);

    try {
      // Find the tenant document by email
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      const q = query(collection(db, "tenants"), where("email", "==", email.trim().toLowerCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No tenant found with this email. The user must sign up first.");
        setProcessing(false);
        return;
      }

      // Update the tenant's role to superadmin
      const tenantDoc = snapshot.docs[0];
      await updateDoc(doc(db, "tenants", tenantDoc.id), {
        role: "superadmin",
        status: "active",
        updatedAt: serverTimestamp(),
      });

      setSuccess(`Successfully upgraded ${email} to superadmin! They can now access the admin panel after logging in.`);
      setEmail("");
    } catch (err: any) {
      console.error("Upgrade error:", err);
      setError("Failed to upgrade user. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f4f8",
      }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: "32px", color: "#25D366" }}></i>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "white",
        borderRadius: "24px",
        padding: "40px",
        width: "100%",
        maxWidth: "480px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            borderRadius: "16px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}>
            <i className="fas fa-shield-alt" style={{ fontSize: "32px", color: "white" }}></i>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>
            Upgrade to Admin
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
            Grant admin privileges to an existing user
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            padding: "14px 16px",
            marginBottom: "20px",
            color: "#166534",
            fontSize: "14px",
          }}>
            <i className="fas fa-check-circle" style={{ marginRight: "8px" }}></i>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "20px",
            color: "#dc2626",
            fontSize: "13px",
          }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: "8px" }}></i>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleUpgrade}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
              User's Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                height: "48px",
                padding: "0 16px",
                border: "1.5px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#8b5cf6"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>
              Enter the email of an existing user to grant them admin access
            </p>
          </div>

          <button
            type="submit"
            disabled={processing}
            style={{
              width: "100%",
              height: "52px",
              background: processing ? "#9ca3af" : "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: processing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            {processing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Upgrading...
              </>
            ) : (
              <>
                <i className="fas fa-arrow-up"></i>
                Upgrade to Admin
              </>
            )}
          </button>
        </form>

        {/* Info Banner */}
        <div style={{
          marginTop: "20px",
          padding: "14px 16px",
          background: "#fef3c7",
          borderRadius: "12px",
          border: "1px solid #fcd34d",
        }}>
          <p style={{ fontSize: "12px", color: "#92400e", margin: 0 }}>
            <i className="fas fa-info-circle" style={{ marginRight: "6px" }}></i>
            The user must already have an account. They'll see the admin sidebar after logging in again.
          </p>
        </div>

        {/* Back Link */}
        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#64748b" }}>
          <a href="/dashboard" style={{ color: "#8b5cf6", fontWeight: "600", textDecoration: "none" }}>
            <i className="fas fa-arrow-left" style={{ marginRight: "6px" }}></i>
            Back to Dashboard
          </a>
        </p>
      </div>
    </div>
  );
}