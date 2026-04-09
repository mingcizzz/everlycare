import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, TextInput, Chip, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { knowledgeService } from '../../../services/knowledge.service';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { GradientButton } from '../../../components/ui/GradientCard';
import type { RootStackScreenProps } from '../../../types/navigation';

const CATEGORIES = [
  { key: 'incontinence', icon: 'shield-alert', color: '#2980B9' },
  { key: 'nutrition', icon: 'food-apple', color: '#E67E22' },
  { key: 'medication', icon: 'pill', color: '#9B59B6' },
  { key: 'mental_health', icon: 'brain', color: '#E74C3C' },
  { key: 'daily_care', icon: 'hand-heart', color: '#1ABC9C' },
];

const CATEGORY_LABELS: Record<string, string> = {
  incontinence: 'knowledge.incontinence',
  nutrition: 'knowledge.nutrition',
  medication: 'knowledge.medicationGuide',
  mental_health: 'knowledge.mentalHealth',
  daily_care: 'knowledge.dailyCare',
};

export function AddArticleScreen({ navigation }: RootStackScreenProps<'AddArticle'>) {
  const { t } = useTranslation();

  const [titleZh, setTitleZh] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentZh, setContentZh] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [category, setCategory] = useState('daily_care');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!titleZh.trim() || !contentZh.trim()) {
      Alert.alert(t('common.error'), 'Title and content are required');
      return;
    }
    setIsLoading(true);
    try {
      await knowledgeService.createArticle({
        titleZh: titleZh.trim(),
        titleEn: titleEn.trim() || undefined,
        contentZh: contentZh.trim(),
        contentEn: contentEn.trim() || undefined,
        category,
      });
      Alert.alert(t('common.done'));
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>{t('knowledge.addTip')}</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category */}
          <Text style={styles.fieldLabel}>{t('knowledge.categories')}</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => {
              const isActive = category === cat.key;
              return (
                <Chip
                  key={cat.key}
                  selected={isActive}
                  onPress={() => setCategory(cat.key)}
                  style={[
                    styles.chip,
                    isActive && { backgroundColor: cat.color },
                  ]}
                  textStyle={isActive ? { color: '#FFFFFF' } : undefined}
                  icon={() => (
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={16}
                      color={isActive ? '#FFFFFF' : cat.color}
                    />
                  )}
                >
                  {t(CATEGORY_LABELS[cat.key])}
                </Chip>
              );
            })}
          </View>

          {/* Chinese title + content */}
          <Text style={styles.sectionLabel}>Chinese</Text>
          <TextInput
            label={`${t('knowledge.title')} (中文) *`}
            value={titleZh}
            onChangeText={setTitleZh}
            mode="outlined"
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />
          <TextInput
            label={`Content (中文) *`}
            value={contentZh}
            onChangeText={setContentZh}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={[styles.input, styles.textArea]}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />

          {/* English title + content (optional) */}
          <Text style={styles.sectionLabel}>English (optional)</Text>
          <TextInput
            label="Title (English)"
            value={titleEn}
            onChangeText={setTitleEn}
            mode="outlined"
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />
          <TextInput
            label="Content (English)"
            value={contentEn}
            onChangeText={setContentEn}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={[styles.input, styles.textArea]}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />

          <GradientButton
            label={t('common.save')}
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading || !titleZh.trim() || !contentZh.trim()}
            icon="content-save"
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...shadows.sm,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  fieldLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  sectionLabel: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
  },
  textArea: {
    minHeight: 120,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});
