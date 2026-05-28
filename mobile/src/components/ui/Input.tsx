import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius } from '../../themes/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  icon,
  containerStyle,
  inputStyle,
  labelStyle,
  ...textInputProps
}) => {
  const colors = useColors();
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: colors.text.secondary },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.background.tertiary,
            borderColor: error
              ? colors.error
              : isFocused
              ? colors.primary
              : colors.border.secondary,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.text.muted}
            style={styles.icon}
          />
        )}
        <TextInput
          {...textInputProps}
          style={[
            styles.input,
            { color: colors.text.primary },
            inputStyle,
          ]}
          placeholderTextColor={colors.text.muted}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
        />
      </View>
      {(error || helper) && (
        <Text
          style={[
            styles.helper,
            { color: error ? colors.error : colors.text.muted },
          ]}
        >
          {error || helper}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing[1.5],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    minHeight: 48,
  },
  icon: {
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: spacing[2.5],
  },
  helper: {
    fontSize: 12,
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
});

export default Input;
