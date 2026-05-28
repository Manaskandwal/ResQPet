import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../themes';
import { spacing, borderRadius } from '../themes/tokens';
import { Avatar } from './ui';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  user?: { name: string; role?: string };
  onUserPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightElement,
  user,
  onUserPress,
}) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        { borderBottomColor: colors.border.secondary },
      ]}
    >
      <View style={styles.left}>
        {showBack && onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backButton,
              { backgroundColor: colors.background.tertiary },
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        )}
        <View>
          {title && (
            <Text
              style={[
                styles.title,
                { color: colors.text.primary },
              ]}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: colors.text.secondary },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.right}>
        {rightElement}
        {user && (
          <TouchableOpacity onPress={onUserPress}>
            <Avatar name={user.name} size="medium" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
});

export default Header;
