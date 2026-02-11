import React from 'react';
import { View, ScrollView, type ViewStyle } from 'react-native';
import { cn } from '../../lib/cn';

export interface BentoItem {
  id: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  colSpan?: 1 | 2;
  rowSpan?: 1 | 2;
  onPress?: () => void;
}

interface BentoGridProps {
  items: BentoItem[];
  columns?: 2 | 3 | 4;
  gap?: number;
  containerStyle?: ViewStyle;
  scrollable?: boolean;
}

const sizeHeights = {
  sm: 120,
  md: 160,
  lg: 200,
  xl: 260,
  full: 300,
};

export default function BentoGrid({
  items,
  columns = 2,
  gap = 12,
  containerStyle,
  scrollable = true,
}: BentoGridProps) {
  const GridContent = () => (
    <View
      className={cn('flex-row flex-wrap', scrollable && 'py-4')}
      style={{ gap, paddingHorizontal: gap }}
    >
      {items.map((item) => {
        const width = calculateWidth(item, columns);
        const height = item.size ? sizeHeights[item.size] : sizeHeights.md;

        return (
          <View
            key={item.id}
            style={{
              width,
              height: item.rowSpan === 2 ? height * 2 + gap : height,
              marginRight: gap,
              marginBottom: gap,
            }}
          >
            <View
              className="w-full h-full rounded-3xl overflow-hidden"
              style={{ backgroundColor: '#111827' }}
              onStartShouldSetResponder={() => !!item.onPress}
              onResponderRelease={() => item.onPress?.()}
            >
              {item.content}
            </View>
          </View>
        );
      })}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={containerStyle}
      >
        <GridContent />
      </ScrollView>
    );
  }

  return <View style={containerStyle}>{GridContent()}</View>;
}

function calculateWidth(item: BentoItem, columns: number): string {
  const containerWidth =
    (columns - 1) * 12 + // gaps
    12 * 2; // padding

  const colSpan = item.colSpan || 1;
  const basePercentage = 100 / columns;

  return `${(basePercentage * colSpan) - (colSpan - 1) * 2}%`;
}

// Preset Bento Card Components
export function BentoCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      className="w-full h-full p-4 justify-between"
      style={style}
    >
      {children}
    </View>
  );
}

export function GradientBentoCard({
  children,
  gradientColors = ['#8b5cf6', '#ec4899'],
  style,
}: {
  children: React.ReactNode;
  gradientColors?: readonly [string, string];
  style?: ViewStyle;
}) {
  return (
    <View
      className="w-full h-full p-4 justify-between"
      style={[
        {
          backgroundColor: gradientColors[0],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
