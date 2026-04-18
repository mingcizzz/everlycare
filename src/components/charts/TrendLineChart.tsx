import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Text } from 'react-native-paper';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { TrendPoint } from '../../services/insights.service';

interface TrendLineChartProps {
  data: TrendPoint[];
  lineColor?: string;
  suffix?: string;
}

export function TrendLineChart({
  data,
  lineColor = colors.primary,
  suffix = '',
}: TrendLineChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data</Text>
      </View>
    );
  }

  const width = Dimensions.get('window').width - spacing.md * 4;

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        data: data.map((d) => d.value),
        color: (opacity = 1) => hexWithOpacity(lineColor, opacity),
        strokeWidth: 4,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={width}
        height={180}
        yAxisSuffix={suffix}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => hexWithOpacity(lineColor, opacity),
          labelColor: (opacity = 1) => hexWithOpacity(colors.textSecondary, opacity),
          style: { borderRadius: borderRadius.md },
          propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: lineColor,
          },
          fillShadowGradient: lineColor,
          fillShadowGradientOpacity: 0.15,
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
}

function hexWithOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  empty: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
});
