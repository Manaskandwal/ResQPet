import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius } from '../../themes/tokens';

interface AvatarProps {
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  source?: string;
  online?: boolean;
  showStatus?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = '',
  size = 'medium',
  source,
  online,
  showStatus = false,
  onPress,
  style,
}) => {
  const colors = useColors();

  const getInitials = () => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return { size: 32, fontSize: 12 };
      case 'medium':
        return { size: 40, fontSize: 14 };
      case 'large':
        return { size: 56, fontSize: 20 };
      case 'xlarge':
        return { size: 80, fontSize: 28 };
      default:
        return { size: 40, fontSize: 14 };
    }
  };

  const sizeStyles = getSize();

  const AvatarContent = (
    <View
      style={[
        styles.avatar,
        {
          width: sizeStyles.size,
          height: sizeStyles.size,
          borderRadius: sizeStyles.size / 2,
          backgroundColor: colors.primary,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize: sizeStyles.fontSize,
            color: colors.background.primary,
          },
        ]}
      >
        {getInitials()}
      </Text>
      {showStatus && (
        <View
          style={[
            styles.status,
            {
              backgroundColor: online ? colors.success : colors.text.muted,
              borderColor: colors.background.primary,
            },
          ]}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>{AvatarContent}</TouchableOpacity>
    );
  }

  return AvatarContent;
};

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: 'small' | 'medium' | 'large';
  overlap?: number;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  names,
  max = 4,
  size: groupSize = 'medium',
  overlap = 12,
}) => {
  const colors = useColors();
  const displayNames = names.slice(0, max);
  const remaining = names.length - max;

  const getSizeValue = () => {
    switch (groupSize) {
      case 'small':
        return 32;
      case 'medium':
        return 40;
      case 'large':
        return 56;
      default:
        return 40;
    }
  };

  const computedSize = getSizeValue();

  return (
    <View style={styles.group}>
      {displayNames.map((name, index) => (
        <View
          key={index}
          style={[
            styles.groupAvatar,
            { marginLeft: index > 0 ? -overlap : 0 },
          ]}
        >
          <Avatar name={name} size={groupSize} />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            styles.overflow,
            {
              marginLeft: -overlap,
              width: computedSize,
              height: computedSize,
              borderRadius: computedSize / 2,
              backgroundColor: colors.background.tertiary,
            },
          ]}
        >
          <Text
            style={[
              styles.overflowText,
              { color: colors.text.primary, fontSize: computedSize * 0.35 },
            ]}
          >
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  initials: {
    fontWeight: '800',
  },
  status: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  overflow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    fontWeight: '700',
  },
});

export default Avatar;
