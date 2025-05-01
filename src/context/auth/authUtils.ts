
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserProfile } from "@/integrations/supabase/adapter";

// Helper to get user from localStorage
export const getUserFromLocalStorage = (): User | null => {
  const savedUser = localStorage.getItem("copymode_user");
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      console.error("Error parsing saved user:", e);
      return null;
    }
  }
  return null;
};

// Helper to save user to localStorage
export const saveUserToLocalStorage = (user: User): void => {
  localStorage.setItem("copymode_user", JSON.stringify(user));
};

// Helper to remove user from localStorage
export const removeUserFromLocalStorage = (): void => {
  localStorage.removeItem("copymode_user");
};

// Helper function to check initial session
export const checkInitialSession = async (): Promise<{
  initialUser: User | null;
  initialSession: any;
}> => {
  const { data: { session: initialSession } } = await supabase.auth.getSession();
  
  if (initialSession?.user) {
    try {
      const user = await fetchUserProfile(initialSession.user.id);
      return { initialUser: user, initialSession };
    } catch (err) {
      console.error("Error fetching initial user profile:", err);
      // Fallback to basic user info
      const fallbackUser = {
        id: initialSession.user.id,
        name: initialSession.user.email || "",
        email: initialSession.user.email || "",
        role: "user"
      };
      return { initialUser: fallbackUser, initialSession };
    }
  }
  
  // Check localStorage for mock user
  const localUser = getUserFromLocalStorage();
  return { initialUser: localUser, initialSession: null };
};
