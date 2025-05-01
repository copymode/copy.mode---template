
import { AuthUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

// Save the user to localStorage for persistence
export const saveUserToLocalStorage = (user: User) => {
  localStorage.setItem("auth_user", JSON.stringify(user));
};

// Remove user from localStorage
export const removeUserFromLocalStorage = () => {
  localStorage.removeItem("auth_user");
};

// Load user from localStorage
export const loadUserFromLocalStorage = (): User | null => {
  const storedUser = localStorage.getItem("auth_user");
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  return null;
};

// Check for existing session on initial load
export const checkInitialSession = async () => {
  try {
    let initialUser = loadUserFromLocalStorage();
    let initialSession = null;
    
    // Try to get current session from Supabase
    const { data } = await supabase.auth.getSession();
    initialSession = data.session;
    
    // If we have a valid Supabase session but no local user,
    // try to fetch user profile
    if (initialSession?.user && !initialUser) {
      try {
        initialUser = await mapSupabaseUser(initialSession.user, initialSession);
      } catch (error) {
        console.error("Error mapping Supabase user:", error);
      }
    }
    
    return { initialUser, initialSession };
  } catch (error) {
    console.error("Error checking initial session:", error);
    return { initialUser: null, initialSession: null };
  }
};

// Map a Supabase user to our app's User type
export const mapSupabaseUser = async (
  supabaseUser: AuthUser,
  session: any
): Promise<User> => {
  try {
    // Try to fetch the user profile from the profiles table
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", supabaseUser.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
    }

    if (profile) {
      // If we have a profile, use that data
      return {
        id: supabaseUser.id,
        name: profile.name || supabaseUser.email?.split("@")[0] || "User",
        email: supabaseUser.email || "",
        role: profile.role as "admin" | "user",
        apiKey: profile.api_key
      };
    } else {
      // Otherwise create a basic user
      return {
        id: supabaseUser.id,
        name: supabaseUser.email?.split("@")[0] || "User",
        email: supabaseUser.email || "",
        role: "user", // Default role
      };
    }
  } catch (error) {
    console.error("Error mapping Supabase user:", error);
    // Fallback if the mapping fails
    return {
      id: supabaseUser.id,
      name: supabaseUser.email?.split("@")[0] || "User",
      email: supabaseUser.email || "",
      role: "user", // Default role
    };
  }
};
