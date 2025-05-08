export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          avatar: string
          created_at: string
          created_by: string
          description: string
          id: string
          model: string
          name: string
          prompt: string
          updated_at: string
        }
        Insert: {
          avatar?: string
          created_at?: string
          created_by: string
          description?: string
          id?: string
          model?: string
          name: string
          prompt?: string
          updated_at?: string
        }
        Update: {
          avatar?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          model?: string
          name?: string
          prompt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_knowledge_chunks: {
        Row: {
          agent_id: string
          chunk_index: number
          chunk_text: string
          created_at: string
          embedding: Json | null
          id: string
          original_file_name: string
        }
        Insert: {
          agent_id: string
          chunk_index: number
          chunk_text: string
          created_at?: string
          embedding?: Json | null
          id?: string
          original_file_name: string
        }
        Update: {
          agent_id?: string
          chunk_index?: number
          chunk_text?: string
          created_at?: string
          embedding?: Json | null
          id?: string
          original_file_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_chunks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
      chats: {
        Row: {
          agent_id: string | null
          content_type: string | null
          created_at: string
          expert_id: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          content_type?: string | null
          created_at?: string
          expert_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          content_type?: string | null
          created_at?: string
          expert_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_content_type_fkey"
            columns: ["content_type"]
            isOneToOne: false
            referencedRelation: "content_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      content_types: {
        Row: {
          avatar: string
          created_at: string
          description: string
          id: string
          name: string
          prompt: string
          updated_at: string
        }
        Insert: {
          avatar?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          prompt?: string
          updated_at?: string
        }
        Update: {
          avatar?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      experts: {
        Row: {
          avatar: string
          created_at: string
          description: string
          id: string
          name: string
          prompt: string
          updated_at: string
        }
        Insert: {
          avatar?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          prompt?: string
          updated_at?: string
        }
        Update: {
          avatar?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          agent_id: string | null
          chat_id: string
          content: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          agent_id?: string | null
          chat_id: string
          content: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          agent_id?: string | null
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          api_key: string | null
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          created_at: string
          name: string
          content: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          content: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          content?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
            isOneToOne: false
          }
        ]
      }
    }
    Views: {}
    Functions: {
      is_owner_of_profile: {
        Args: {
          profile_id: string
        }
        Returns: boolean
      }
      match_knowledge_chunks: {
        Args: {
          match_agent_id: string
          query_embedding: Json
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          agent_id: string
          chunk_index: number
          chunk_text: string
          similarity: number
          original_file_name: string
        }[]
      }
      update_user_api_key: {
        Args: {
          api_key_value: string
        }
        Returns: undefined
      }
      update_user_name: {
        Args: {
          name_value: string
        }
        Returns: undefined
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
} 