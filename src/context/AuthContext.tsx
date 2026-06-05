"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  UserCredential,
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { tenantService } from "@/lib/db";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isLoadingAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);

  // Check if user is admin (check role from tenant document in database)
  const checkAdminStatus = async (user: User | null) => {
    if (!user) {
      setIsAdmin(false);
      setIsLoadingAdmin(false);
      return;
    }

    setIsLoadingAdmin(true);
    try {
      const tenant = await tenantService.getTenant(user);
      // Check if user has admin or superadmin role
      setIsAdmin(tenant?.role === "admin" || tenant?.role === "superadmin");
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setIsLoadingAdmin(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      checkAdminStatus(user);
    });

    return () => unsubscribe();
  }, []);

  // Re-check admin status when user changes
  useEffect(() => {
    checkAdminStatus(user);
  }, [user?.email]);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth not initialized");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth not initialized");
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isLoadingAdmin, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
