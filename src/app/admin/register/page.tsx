"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      // Create admin tenant document with role
      const tenantId = `tenant_${user.uid}`;
      await setDoc(doc(db, "tenants", tenantId), {
        id: tenantId,
        userId: user.uid,
        name: form.name,
        email: form.email,
        businessName: form.businessName || form.name,
        phone: form.phone,
        plan: "enterprise",
        status: "active",
        role: "superadmin", // Highest admin level
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Also create a business profile
      await setDoc(doc(db, "businessProfiles", tenantId), {
        tenantId,
        businessName: form.businessName || form.name,
        email: form.email,
        phone: form.phone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to create account");
      setLoading(false);
    }
  };

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
            background: "linear-gradient(135deg, #25D366, #128C7E)",
            borderRadius: "16px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}>
            <i className="fab fa-whatsapp" style={{ fontSize: "32px", color: "white" }}></i>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>
            Admin Registration
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
            Create your platform administrator account
          </p>
        </div>

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
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                onFocus={(e) => e.target.style.borderColor = "#25D366"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="admin@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                onFocus={(e) => e.target.style.borderColor = "#25D366"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+254 712 345 678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = "#25D366"}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  Business Name
                </label>
                <input
                  type="text"
                  placeholder="My Platform"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = "#25D366"}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                onFocus={(e) => e.target.style.borderColor = "#25D366"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                Confirm Password *
              </label>
              <input
                type="password"
                required
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
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
                onFocus={(e) => e.target.style.borderColor = "#25D366"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "52px",
              marginTop: "24px",
              background: loading ? "#9ca3af" : "linear-gradient(135deg, #25D366, #128C7E)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Creating Account...
              </>
            ) : (
              <>
                <i className="fas fa-shield-alt"></i>
                Create Admin Account
              </>
            )}
          </button>
        </form>

        {/* Info Banner */}
        <div style={{
          marginTop: "20px",
          padding: "14px 16px",
          background: "#f0fdf4",
          borderRadius: "12px",
          border: "1px solid #bbf7d0",
        }}>
          <p style={{ fontSize: "12px", color: "#166534", margin: 0 }}>
            <i className="fas fa-info-circle" style={{ marginRight: "6px" }}></i>
            This account will be created with <strong>superadmin</strong> privileges, giving you full access to manage all tenants on the platform.
          </p>
        </div>

        {/* Login Link */}
        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#64748b" }}>
          Already have an account?{" "}
          <a href="/" style={{ color: "#25D366", fontWeight: "600", textDecoration: "none" }}>
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}