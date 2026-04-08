import { supabase } from './supabase';

export interface Article {
  id: string;
  titleZh: string;
  titleEn?: string;
  contentZh: string;
  contentEn?: string;
  category: string;
  tags: string[];
  createdAt: string;
}

export const knowledgeService = {
  async getArticles(category?: string): Promise<Article[]> {
    let query = supabase
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapFromDb);
  },

  async getArticleById(id: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return mapFromDb(data);
  },
};

function mapFromDb(row: any): Article {
  return {
    id: row.id,
    titleZh: row.title_zh,
    titleEn: row.title_en,
    contentZh: row.content_zh,
    contentEn: row.content_en,
    category: row.category,
    tags: row.tags || [],
    createdAt: row.created_at,
  };
}
