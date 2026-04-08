"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import BrandPanel from "@/components/auth/BrandPanel";
import MobileLogo from "@/components/auth/MobileLogo";
import FloatingShapes from "@/components/auth/FloatingShapes";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();

  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#667eea] to-[#764ba2] relative overflow-hidden">
      <FloatingShapes />
      <BrandPanel />

      <div className="w-full lg:w-[600px] bg-white flex flex-col justify-center p-8 lg:p-12">
        <div className="w-full max-w-[420px] mx-auto">
          <MobileLogo />

          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl lg:text-[2.25rem] font-bold text-[#1a1a2e] mb-2">
              Welcome Back! 👋
            </h1>
            <p className="text-[#6b7280] text-sm">Sign in to manage your products and automate your sales</p>
          </div>

          <LoginForm
            email={email}
            password={password}
            error={error}
            isLoading={isLoading}
            showPassword={showPassword}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onTogglePassword={togglePassword}
            onSubmit={handleSubmit}
            onGoogleLogin={handleGoogleLogin}
          />

          <div className="text-center mt-8 text-sm text-[#6b7280]">
            Don&apos;t have an account?
            <button
              onClick={() => router.push("/register")}
              className="text-[#25D366] no-underline font-bold ml-1 hover:underline bg-transparent border-none cursor-pointer"
            >
              Start free trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
