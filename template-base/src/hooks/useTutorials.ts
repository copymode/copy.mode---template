import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateTutorialData {
  title: string;
  description: string;
  youtube_url: string;
}

export interface UpdateTutorialData extends CreateTutorialData {
  id: string;
}

export function useTutorials() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Buscar tutoriais
  const fetchTutorials = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await (supabase as any)
        .from('tutorials')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      setTutorials(data || []);
    } catch (err) {
      console.error('Erro ao buscar tutoriais:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar tutoriais');
    } finally {
      setLoading(false);
    }
  };

  // Criar tutorial
  const createTutorial = async (data: CreateTutorialData): Promise<void> => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Apenas administradores podem criar tutoriais');
    }

    try {
      // Obter próximo order_index
      const { data: maxOrderData } = await (supabase as any)
        .from('tutorials')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrder = maxOrderData && maxOrderData.length > 0 
        ? maxOrderData[0].order_index + 1 
        : 1;

      const { error } = await (supabase as any)
        .from('tutorials')
        .insert([{
          ...data,
          order_index: nextOrder,
          created_by: currentUser.id,
        }]);

      if (error) throw error;

      // Recarregar tutoriais
      await fetchTutorials();
    } catch (err) {
      console.error('Erro ao criar tutorial:', err);
      throw err;
    }
  };

  // Atualizar tutorial
  const updateTutorial = async (data: UpdateTutorialData): Promise<void> => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Apenas administradores podem editar tutoriais');
    }

    try {
      const { id, ...updateData } = data;
      
      const { error } = await (supabase as any)
        .from('tutorials')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Recarregar tutoriais
      await fetchTutorials();
    } catch (err) {
      console.error('Erro ao atualizar tutorial:', err);
      throw err;
    }
  };

  // Deletar tutorial
  const deleteTutorial = async (id: string): Promise<void> => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Apenas administradores podem excluir tutoriais');
    }

    try {
      const { error } = await (supabase as any)
        .from('tutorials')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      // Recarregar tutoriais
      await fetchTutorials();
    } catch (err) {
      console.error('Erro ao excluir tutorial:', err);
      throw err;
    }
  };

  // Mover tutorial para cima
  const moveTutorialUp = async (tutorialId: string): Promise<void> => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Apenas administradores podem reordenar tutoriais');
    }

    try {
      const currentTutorial = tutorials.find(t => t.id === tutorialId);
      if (!currentTutorial) return;

      const currentIndex = tutorials.findIndex(t => t.id === tutorialId);
      if (currentIndex <= 0) return; // Já está no topo

      const previousTutorial = tutorials[currentIndex - 1];
      
      // Trocar order_index entre os dois tutoriais
      const { error: error1 } = await (supabase as any)
        .from('tutorials')
        .update({ order_index: previousTutorial.order_index })
        .eq('id', tutorialId);

      if (error1) throw error1;

      const { error: error2 } = await (supabase as any)
        .from('tutorials')
        .update({ order_index: currentTutorial.order_index })
        .eq('id', previousTutorial.id);

      if (error2) throw error2;

      // Recarregar tutoriais
      await fetchTutorials();
    } catch (err) {
      console.error('Erro ao mover tutorial para cima:', err);
      throw err;
    }
  };

  // Mover tutorial para baixo
  const moveTutorialDown = async (tutorialId: string): Promise<void> => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Apenas administradores podem reordenar tutoriais');
    }

    try {
      const currentTutorial = tutorials.find(t => t.id === tutorialId);
      if (!currentTutorial) return;

      const currentIndex = tutorials.findIndex(t => t.id === tutorialId);
      if (currentIndex >= tutorials.length - 1) return; // Já está no final

      const nextTutorial = tutorials[currentIndex + 1];
      
      // Trocar order_index entre os dois tutoriais
      const { error: error1 } = await (supabase as any)
        .from('tutorials')
        .update({ order_index: nextTutorial.order_index })
        .eq('id', tutorialId);

      if (error1) throw error1;

      const { error: error2 } = await (supabase as any)
        .from('tutorials')
        .update({ order_index: currentTutorial.order_index })
        .eq('id', nextTutorial.id);

      if (error2) throw error2;

      // Recarregar tutoriais
      await fetchTutorials();
    } catch (err) {
      console.error('Erro ao mover tutorial para baixo:', err);
      throw err;
    }
  };

  // Carregar tutoriais na inicialização
  useEffect(() => {
    fetchTutorials();
  }, []);

  return {
    tutorials,
    loading,
    error,
    fetchTutorials,
    createTutorial,
    updateTutorial,
    deleteTutorial,
    moveTutorialUp,
    moveTutorialDown,
  };
} 