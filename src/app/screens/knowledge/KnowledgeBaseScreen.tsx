import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddArticle')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={'plus' as any}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryBar}
      >
        {/* "All" chip */}
        <TouchableOpacity
          style={[
            styles.chip,
            !selectedCategory ? styles.chipActive : styles.chipInactive,
          ]}
          onPress={() => setSelectedCategory(null)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={'view-grid' as any}
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
              name={'book-open-page-variant' as any}
              size={48}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyText}>{t('common.noData')}</Text>
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
              <ArticleCard
                key={article.id}
                title={title}
                preview={preview}
                meta={meta}
                catLabel={t(catLabel)}
                onPress={() =>
                  navigation.navigate('ArticleDetail', {
                    articleId: article.id,
                  })
                }
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  ArticleCard with press animation                                   */
/* ------------------------------------------------------------------ */

function ArticleCard({
  title,
  preview,
  meta,
  catLabel,
  onPress,
}: {
  title: string;
  preview: string;
  meta: { icon: string; color: string };
  catLabel: string;
  onPress: () => void;
}) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={styles.articleCard}>
          <View style={styles.articleRow}>
            {/* Icon */}
            <View
              style={[
                styles.articleIconCircle,
                { backgroundColor: meta.color + '15' },
              ]}
            >
              <MaterialCommunityIcons
                name={meta.icon as any}
                size={24}
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
              {/* Category Tag - bottom right */}
              <View style={styles.categoryTagRow}>
                <View style={{ flex: 1 }} />
                <View
                  style={[
                    styles.categoryTag,
                    { backgroundColor: meta.color + '18' },
                  ]}
                >
                  <Text
                    style={[styles.categoryTagText, { color: meta.color }]}
                  >
                    {catLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category Bar
  categoryBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minHeight: 48,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Content
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: 12,
  },

  // Article Card
  articleCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  articleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  articleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  articleTextWrap: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  articlePreview: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  categoryTagRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
