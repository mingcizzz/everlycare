import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { knowledgeService } from '../../../services/knowledge.service';
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Dark compact header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('knowledge.addTip')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category chips */}
          <Text style={styles.fieldLabel}>{t('knowledge.categories')}</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => {
              const isActive = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setCategory(cat.key)}
                  style={[
                    styles.chip,
                    isActive && { backgroundColor: '#064E3B', borderColor: '#064E3B' },
                  ]}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={15}
                    color={isActive ? '#FFFFFF' : cat.color}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      isActive && { color: '#FFFFFF' },
                    ]}
                  >
                    {t(CATEGORY_LABELS[cat.key])}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Chinese title + content */}
          <Text style={styles.sectionLabel}>Chinese</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={titleZh}
              onChangeText={setTitleZh}
              placeholder={`${t('knowledge.title')} (中文) *`}
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              value={contentZh}
              onChangeText={setContentZh}
              placeholder="Content (中文) *"
              placeholderTextColor="#94A3B8"
              style={[styles.textInput, styles.textArea]}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* English title + content (optional) */}
          <Text style={styles.sectionLabel}>English (optional)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={titleEn}
              onChangeText={setTitleEn}
              placeholder="Title (English)"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              value={contentEn}
              onChangeText={setContentEn}
              placeholder="Content (English)"
              placeholderTextColor="#94A3B8"
              style={[styles.textInput, styles.textArea]}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Solid save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !titleZh.trim() || !contentZh.trim()}
            activeOpacity={0.8}
            style={[
              styles.button,
              (isLoading || !titleZh.trim() || !contentZh.trim()) && styles.buttonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t('common.save')}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#064E3B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#064E3B',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  textInput: {
    fontSize: 15,
    color: '#1E293B',
    height: 48,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  button: {
    backgroundColor: '#064E3B',
    borderRadius: 24,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
