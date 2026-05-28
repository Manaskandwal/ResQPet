import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useColors } from '../../themes';
import { spacing, borderRadius } from '../../themes/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  disabled = false,
}) => {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? colors.primary
            : colors.background.tertiary,
          borderColor: selected ? colors.primary : colors.border.secondary,
        },
        disabled && styles.disabled,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.label,
          {
            color: selected
              ? colors.background.primary
              : colors.text.primary,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface ChipGroupProps {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  selectedValues: string[] | string;
  onChange: (values: string[] | string) => void;
  multiple?: boolean;
  scrollable?: boolean;
}

export const ChipGroup: React.FC<ChipGroupProps> = ({
  options,
  selectedValues,
  onChange,
  multiple = false,
  scrollable = true,
}) => {
  const isSelected = (value: string) => {
    if (multiple) {
      return (selectedValues as string[]).includes(value);
    }
    return selectedValues === value;
  };

  const handlePress = (value: string) => {
    if (multiple) {
      const current = selectedValues as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChange(updated);
    } else {
      onChange(value);
    }
  };

  const chips = options.map((option) => (
    <Chip
      key={option.value}
      label={option.label}
      selected={isSelected(option.value)}
      onPress={() => handlePress(option.value)}
      icon={option.icon}
    />
  ));

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {chips}
      </ScrollView>
    );
  }

  return <View style={styles.container}>{chips}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  scrollContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3.5],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  icon: {
    marginRight: spacing[1.5],
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Chip;
