
import { supabase } from "./client";
import { User } from "@/types";

export async function fetchUserProfile(userId: string): Promise<User> {
  console.log("Fetching user profile for:", userId);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
    
    if (!data) {
      console.error("No user profile found");
      throw new Error("User profile not found");
    }
    
    console.log("User profile data from Supabase:", data);
    
    // Map database fields to User type, ensuring role is the correct type
    return {
      id: data.id,
      name: data.name || data.email || "Usuário",
      email: data.email || "",
      role: data.role === "admin" ? "admin" : "user", // Ensure role is either "admin" or "user"
      apiKey: data.api_key || null
    };
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  console.log("Updating user profile:", userId, updates);
  
  // Map User type fields to database fields
  const dbUpdates: any = {};
  
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.email) dbUpdates.email = updates.email;
  if (updates.apiKey !== undefined) dbUpdates.api_key = updates.apiKey;
  
  try {
    console.log("Sending update to Supabase:", dbUpdates);
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select('*')
      .single();
    
    if (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
    
    console.log("Updated profile data:", data);
    
    // Ensure we correctly map the database response back to our User type
    return {
      id: data.id,
      name: data.name || data.email || "Usuário",
      email: data.email || "",
      role: data.role === "admin" ? "admin" : "user",
      apiKey: data.api_key || null
    };
  } catch (error) {
    console.error("Failed to update user profile:", error);
    throw error;
  }
}
