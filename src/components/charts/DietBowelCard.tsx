import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Bristol 1-2 hard, 3-4 ideal (green), 5-7 soft/loose
function bristolColor(score: number): string {
  if (score <= 2.5) return '#B45309';
  if (score <= 4.5) return '#059669';
  return '#EA580C';
}

interface DietBowelCardProps {
  correlations: { mealDescription: string; avgBristol: number; sampleCount: number }[];
}

export function DietBowelCard({ correlations }: DietBowelCardProps) {
  const { t } = useTranslation();
  const hasData = correlations.length > 0;

  const bristolLabel = (score: number): string => {
    if (score <= 2.5) return t('insights.diet.labelHard');
    if (score <= 4.5) return t('insights.diet.labelIdeal');
    return t('insights.diet.labelSoft');
  };

  return (
    <View style={st.card}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <View style={st.iconBox}>
            <MaterialCommunityIcons name="food-variant" size={14} color="#FFF" />
          </View>
          <Text style={st.title}>{t('insights.diet.title')}</Text>
        </View>
        <Text style={st.hint}>{t('insights.diet.hint')}</Text>
      </View>
      <Text style={st.subtitle}>
        {hasData
          ? t('insights.diet.subtitleData')
          : t('insights.diet.subtitleEmpty')}
      </Text>

      {!hasData ? (
        <View style={st.emptyRow}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={32} color="#E2E8F0" />
          <Text style={st.emptyText}>{t('insights.diet.empty')}</Text>
          <Text style={st.emptyHint}>{t('insights.diet.emptyHint')}</Text>
        </View>
      ) : (
        <>
          {/* Column headers */}
          <View style={st.tableHead}>
            <Text style={[st.col1, st.headText]}>{t('insights.diet.colFood')}</Text>
            <Text style={[st.col2, st.headText]}>{t('insights.diet.colAvg')}</Text>
            <Text style={[st.col3, st.headText]}>{t('insights.diet.colType')}</Text>
            <Text style={[st.col4, st.headText]}>{t('insights.diet.colCount')}</Text>
          </View>

          {correlations.map((item, idx) => {
            const color = bristolColor(item.avgBristol);
            return (
              <View key={idx} style={[st.row, idx % 2 === 1 && st.rowAlt]}>
                <Text style={st.col1} numberOfLines={1}>{item.mealDescription}</Text>
                <Text style={[st.col2, { color, fontWeight: '700' }]}>
                  {item.avgBristol.toFixed(1)}
                </Text>
                <View style={[st.labelBadge, { backgroundColor: `${color}1A` }]}>
                  <Text style={[st.labelText, { color }]}>{bristolLabel(item.avgBristol)}</Text>
                </View>
                <Text style={st.col4}>{item.sampleCount}</Text>
              </View>
            );
          })}

          {/* Legend */}
          <View style={st.legend}>
            {[
              { color: '#B45309', key: 'legendHard' },
              { color: '#059669', key: 'legendIdeal' },
              { color: '#EA580C', key: 'legendSoft' },
            ].map(({ color, key }) => (
              <View key={key} style={st.legendItem}>
                <View style={[st.legendDot, { backgroundColor: color }]} />
                <Text style={st.legendText}>{t(`insights.diet.${key}`)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  hint: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  subtitle: { fontSize: 12, color: '#94A3B8', marginBottom: 14, marginLeft: 34 },

  /* Empty */
  emptyRow: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyText: { fontSize: 14, color: '#CBD5E1', fontWeight: '600' },
  emptyHint: { fontSize: 12, color: '#CBD5E1', textAlign: 'center', lineHeight: 18 },

  /* Table */
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  headText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowAlt: { backgroundColor: '#FAFAFA', borderRadius: 8 },
  col1: { flex: 1, fontSize: 13, color: '#1E293B', paddingHorizontal: 4 },
  col2: { width: 38, fontSize: 13, color: '#1E293B', textAlign: 'center' },
  col3: { width: 54, alignItems: 'center' },
  col4: { width: 32, fontSize: 12, color: '#94A3B8', textAlign: 'center' },
  labelBadge: {
    width: 54,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  labelText: { fontSize: 10, fontWeight: '700' },

  /* Legend */
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: '#64748B' },
});
