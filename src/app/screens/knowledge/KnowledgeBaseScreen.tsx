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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
  const insets = useSafeAreaInsets();
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
    <View style={styles.container}>
      {/* Dark Hero Header */}
      <LinearGradient
        colors={['#064E3B', '#065F46', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroHeader, { paddingTop: insets.top + 20 }]}
      >
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Care Tips</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddArticle')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={'plus' as any}
              size={16}
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
            <Text
              style={[
                styles.chipText,
                !selectedCategory
                  ? styles.chipTextActive
                  : styles.chipTextInactive,
              ]}
            >
              {t('knowledge.all')}
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  isActive ? styles.chipActive : styles.chipInactive,
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive
                      ? styles.chipTextActive
                      : styles.chipTextInactive,
                  ]}
                >
                  {t(CATEGORY_LABELS[cat])}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* Light Section */}
      <ScrollView
        style={styles.lightSection}
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
              color="#94A3B8"
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
    </View>
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
                { backgroundColor: meta.color + '1A' },
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
              {/* Category Tag */}
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
    backgroundColor: '#F1F5F9',
  },

  // Hero Header
  heroHeader: {
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category Bar
  categoryBar: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#FFFFFF',
  },
  chipInactive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#064E3B',
    fontWeight: '600',
  },
  chipTextInactive: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Light Section
  lightSection: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
  },

  // Article Card
  articleCard: {
    backgroundColor: '#FFFFFF',
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
    gap: 14,
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
    color: '#1E293B',
    lineHeight: 22,
  },
  articlePreview: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  categoryTagRow: {
    flexDirection: 'row',
    marginTop: 8,
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
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
  },
});
