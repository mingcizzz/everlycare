import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { useSettingsStore } from '../../../store/settingsStore';
import { knowledgeService, type Article } from '../../../services/knowledge.service';
import type { MainTabScreenProps } from '../../../types/navigation';

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  incontinence: { icon: 'shield-alert', color: '#2980B9' },
  nutrition: { icon: 'food-apple', color: '#E67E22' },
  medication: { icon: 'pill', color: '#9B59B6' },
  mental_health: { icon: 'brain', color: '#E74C3C' },
  daily_care: { icon: 'hand-heart', color: '#1ABC9C' },
};

const CATEGORY_LABELS: Record<string, string> = {
  incontinence: 'knowledge.incontinence',
  nutrition: 'knowledge.nutrition',
  medication: 'knowledge.medicationGuide',
  mental_health: 'knowledge.mentalHealth',
  daily_care: 'knowledge.dailyCare',
};

export function KnowledgeBaseScreen({ navigation }: MainTabScreenProps<'Knowledge'>) {
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const data = await knowledgeService.getArticles(selectedCategory || undefined);
      setArticles(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  const categories = Object.keys(CATEGORY_META);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('knowledge.title')}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryBar}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategory && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.categoryChipText,
              !selectedCategory && styles.categoryChipTextActive,
            ]}
          >
            {t('common.add')}
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                isActive && {
                  backgroundColor: meta.color,
                  borderColor: meta.color,
                },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <MaterialCommunityIcons
                name={meta.icon as any}
                size={16}
                color={isActive ? '#FFFFFF' : meta.color}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  isActive && styles.categoryChipTextActive,
                ]}
              >
                {t(CATEGORY_LABELS[cat])}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadArticles} />
        }
      >
        {articles.length === 0 && !isLoading ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={80}
                color={colors.textDisabled}
              />
              <Text style={styles.emptyText}>{t('common.noData')}</Text>
            </Card.Content>
          </Card>
        ) : (
          articles.map((article) => {
            const title =
              language === 'en' && article.titleEn
                ? article.titleEn
                : article.titleZh;
            const preview =
              language === 'en' && article.contentEn
                ? article.contentEn
                : article.contentZh;
            const meta = CATEGORY_META[article.category] || CATEGORY_META.daily_care;

            return (
              <TouchableOpacity
                key={article.id}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('ArticleDetail', { articleId: article.id })
                }
              >
                <Card
                  style={[
                    styles.articleCard,
                    { borderLeftWidth: 4, borderLeftColor: meta.color },
                  ]}
                >
                  <Card.Content style={styles.articleContent}>
                    <View
                      style={[
                        styles.articleIcon,
                        { backgroundColor: meta.color + '15' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={meta.icon as any}
                        size={24}
                        color={meta.color}
                      />
                    </View>
                    <View style={styles.articleText}>
                      <Text style={styles.articleTitle} numberOfLines={2}>
                        {title}
                      </Text>
                      <Text style={styles.articlePreview} numberOfLines={2}>
                        {preview}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  categoryBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  articleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  articleContent: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  articleIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleText: {
    flex: 1,
  },
  articleTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  articlePreview: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
