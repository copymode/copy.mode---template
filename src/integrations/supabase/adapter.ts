
import { supabase } from "./client";
import { User } from "@/types";

export async function fetchUserProfile(userId: string): Promise<User> {
  console.log("Fetching user profile for:", userId);
  
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
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  // Map User type fields to database fields
  const dbUpdates: any = {};
  
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.email) dbUpdates.email = updates.email;
  if (updates.apiKey !== undefined) dbUpdates.api_key = updates.apiKey;
  
  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select('*')
    .single();
  
  if (error) {
    throw error;
  }
  
  return {
    id: data.id,
    name: data.name || data.email || "Usuário",
    email: data.email || "",
    role: data.role === "admin" ? "admin" : "user", // Ensure role is either "admin" or "user"
    apiKey: data.api_key || null
  };
}
