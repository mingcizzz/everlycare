import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { useSettingsStore } from '../../../store/settingsStore';
import { knowledgeService, type Article } from '../../../services/knowledge.service';
import type { RootStackScreenProps } from '../../../types/navigation';

const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  incontinence: { icon: 'shield-alert', color: '#2980B9', label: 'knowledge.incontinence' },
  nutrition: { icon: 'food-apple', color: '#E67E22', label: 'knowledge.nutrition' },
  medication: { icon: 'pill', color: '#9B59B6', label: 'knowledge.medicationGuide' },
  mental_health: { icon: 'brain', color: '#E74C3C', label: 'knowledge.mentalHealth' },
  daily_care: { icon: 'hand-heart', color: '#1ABC9C', label: 'knowledge.dailyCare' },
};

export function ArticleDetailScreen({
  route,
  navigation,
}: RootStackScreenProps<'ArticleDetail'>) {
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    knowledgeService
      .getArticleById(route.params.articleId)
      .then((a) => {
        setArticle(a);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [route.params.articleId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>{t('common.error')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const title = language === 'en' && article.titleEn ? article.titleEn : article.titleZh;
  const content =
    language === 'en' && article.contentEn ? article.contentEn : article.contentZh;
  const meta = CATEGORY_META[article.category] || CATEGORY_META.daily_care;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Category badge */}
        <View style={[styles.categoryBadge, { backgroundColor: meta.color + '15' }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={16} color={meta.color} />
          <Text style={[styles.categoryText, { color: meta.color }]}>
            {t(meta.label)}
          </Text>
        </View>

        <Text style={styles.title}>{title}</Text>

        {/* Render formatted content */}
        <FormattedContent text={content} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Parses text with \n into paragraphs, numbered lists, and bullet points */
function FormattedContent({ text }: { text: string }) {
  // Normalize: replace literal "\n" strings with actual newlines
  const normalized = text.replace(/\\n/g, '\n');

  // Split by double newline for paragraphs
  const paragraphs = normalized.split(/\n\n+/);

  return (
    <View style={styles.articleBody}>
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split(/\n/);

        return (
          <View key={pIdx} style={styles.paragraph}>
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              // Numbered list item: "1. text" or "1、text"
              const numberedMatch = trimmed.match(/^(\d+)[.、]\s*(.*)/);
              if (numberedMatch) {
                return (
                  <View key={lIdx} style={styles.listItem}>
                    <View style={styles.listBullet}>
                      <Text style={styles.listNumber}>{numberedMatch[1]}</Text>
                    </View>
                    <Text style={styles.listText}>
                      {formatBoldText(numberedMatch[2])}
                    </Text>
                  </View>
                );
              }

              // Bullet point: "- text" or "• text"
              const bulletMatch = trimmed.match(/^[-•]\s*(.*)/);
              if (bulletMatch) {
                return (
                  <View key={lIdx} style={styles.listItem}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.listText}>
                      {formatBoldText(bulletMatch[1])}
                    </Text>
                  </View>
                );
              }

              // Regular paragraph text
              return (
                <Text key={lIdx} style={styles.bodyText}>
                  {formatBoldText(trimmed)}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

/** Renders text with "Bold: rest" pattern — makes the part before colon bold */
function formatBoldText(text: string): React.ReactNode {
  // Pattern: "Label: description" or "Label：description"
  const colonMatch = text.match(/^(.+?)[：:]\s*(.*)/);
  if (colonMatch && colonMatch[1].length < 20) {
    return (
      <Text>
        <Text style={styles.boldText}>{colonMatch[1]}</Text>
        {'：'}
        {colonMatch[2]}
      </Text>
    );
  }
  return text;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  categoryText: {
    ...typography.caption,
    fontWeight: '600',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  articleBody: {
    gap: spacing.md,
  },
  paragraph: {
    gap: spacing.sm,
  },
  bodyText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  boldText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingLeft: spacing.xs,
  },
  listBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  listNumber: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  listText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 26,
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
