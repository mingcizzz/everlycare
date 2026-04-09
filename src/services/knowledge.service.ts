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

  async createArticle(article: {
    titleZh: string;
    titleEn?: string;
    contentZh: string;
    contentEn?: string;
    category: string;
    tags?: string[];
  }): Promise<Article> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('articles')
      .insert({
        title_zh: article.titleZh,
        title_en: article.titleEn || null,
        content_zh: article.contentZh,
        content_en: article.contentEn || null,
        category: article.category,
        tags: article.tags || [],
        author_id: session.user.id,
        is_published: true,
      })
      .select()
      .single();

    if (error) throw error;
    return mapFromDb(data);
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
