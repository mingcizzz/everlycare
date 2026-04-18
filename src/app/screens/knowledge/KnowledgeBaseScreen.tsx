import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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

export function KnowledgeBaseScreen({
  navigation,
}: MainTabScreenProps<'Knowledge'>) {
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await knowledgeService.getArticles(
        selectedCategory || undefined
      );
      setArticles(data);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useFocusEffect(
    useCallback(() => {
      loadArticles();
    }, [loadArticles])
  );

  const categories = Object.keys(CATEGORY_META);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('knowledge.title')}</Text>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryBar}
      >
        {/* "All" chip */}
        <TouchableOpacity
          style={[
            styles.chip,
            !selectedCategory
              ? styles.chipActive
              : styles.chipInactive,
          ]}
          onPress={() => setSelectedCategory(null)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="view-grid"
            size={14}
            color={!selectedCategory ? '#FFFFFF' : colors.primary}
          />
          <Text
            style={[
              styles.chipText,
              !selectedCategory && styles.chipTextActive,
            ]}
          >
            {t('knowledge.all')}
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                isActive
                  ? [styles.chipActive, { backgroundColor: meta.color }]
                  : styles.chipInactive,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={meta.icon as any}
                size={14}
                color={isActive ? '#FFFFFF' : meta.color}
              />
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.chipTextActive,
                ]}
              >
                {t(CATEGORY_LABELS[cat])}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Articles List */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadArticles} />
        }
      >
        {articles.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="book-open-page-variant"
              size={64}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>{t('common.noData')}</Text>
          </View>
        ) : (
          articles.map((article) => {
            const title =
              language === 'en' && article.titleEn
                ? article.titleEn
                : article.titleZh;
            const rawPreview =
              language === 'en' && article.contentEn
                ? article.contentEn
                : article.contentZh;
            const preview = rawPreview
              .replace(/\\\\n/g, ' ')
              .replace(/\\n/g, ' ')
              .replace(/\n/g, ' ')
              .replace(/\s{2,}/g, ' ')
              .trim();
            const meta =
              CATEGORY_META[article.category] || CATEGORY_META.daily_care;
            const catLabel =
              CATEGORY_LABELS[article.category] || 'knowledge.dailyCare';

            return (
              <TouchableOpacity
                key={article.id}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('ArticleDetail', {
                    articleId: article.id,
                  })
                }
              >
                <View
                  style={[
                    styles.articleCard,
                    { borderLeftColor: meta.color },
                  ]}
                >
                  <View style={styles.articleRow}>
                    {/* Icon */}
                    <View
                      style={[
                        styles.articleIconCircle,
                        { backgroundColor: meta.color + '12' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={meta.icon as any}
                        size={22}
                        color={meta.color}
                      />
                    </View>

                    {/* Text Content */}
                    <View style={styles.articleTextWrap}>
                      <Text style={styles.articleTitle} numberOfLines={2}>
                        {title}
                      </Text>
                      <Text style={styles.articlePreview} numberOfLines={2}>
                        {preview}
                      </Text>
                      {/* Category Tag */}
                      <View
                        style={[
                          styles.categoryTag,
                          { backgroundColor: meta.color + '12' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryTagText,
                            { color: meta.color },
                          ]}
                        >
                          {t(catLabel)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddArticle')}
        activeOpacity={0.85}
      >
        <View style={styles.fabInner}>
          <MaterialCommunityIcons name="plus" size={26} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },

  // Category Bar
  categoryBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // Content
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
    gap: spacing.sm,
  },

  // Article Card
  articleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    ...shadows.sm,
  },
  articleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  articleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  articleTextWrap: {
    flex: 1,
  },
  articleTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  articlePreview: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    ...shadows.lg,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
