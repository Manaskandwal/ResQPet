import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Chip from '../../components/ui/Chip';
import Button from '../../components/ui/Button';
import { AnimatedPress } from '../../components/AnimatedPress';

export function SubmitRescueScreen() {
  const colors = useColors();
  const navigation = useNavigation();

  const [description, setDescription] = useState('');
  const [animalType, setAnimalType] = useState('dog');
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const animalOptions = [
    { value: 'dog', label: '🐕 Dog' },
    { value: 'cat', label: '🐈 Cat' },
    { value: 'bird', label: '🐦 Bird' },
    { value: 'other', label: '🐾 Other' },
  ];

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert('Permission required', 'Please enable gallery access to upload rescue evidence.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled) {
      setMedia(result.assets.slice(0, 6));
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      return Alert.alert('Error', 'Please describe the animal condition and situation.');
    }
    setSubmitting(true);
    try {
      const locationPerm = await Location.requestForegroundPermissionsAsync();
      if (!locationPerm.granted) {
        Alert.alert('Location required', 'Precise location coordinates are required to dispatch NGO responders.');
        setSubmitting(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});

      const formData = new FormData();
      formData.append('description', description);
      formData.append('animalType', animalType);
      formData.append('lat', String(position.coords.latitude));
      formData.append('lng', String(position.coords.longitude));
      formData.append('willingToPay', 'false');
      formData.append('willingToGo', 'false');

      media.forEach((asset, index) => {
        formData.append('media', {
          uri: asset.uri,
          name: asset.fileName || `rescue-evidence-${index}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
          type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        } as any);
      });

      await api.post('/rescue', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('✅ Rescue Submitted', 'Rescuers in the area have been pinged.', [
        { text: 'View Reports', onPress: () => navigation.navigate('cases') },
      ]);
    } catch (e: any) {
      Alert.alert('Submission Failed', e.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scrollable
      title="Report Case"
      subtitle="Alert verified rescue agencies in your proximity"
      style={{ backgroundColor: colors.background.primary }}
    >
      <Card variant="glass" style={styles.formCard}>
        {/* Description Field */}
        <Input
          label="What is the situation?"
          placeholder="Describe the animal type, visible wounds, or distress status. Be as descriptive as possible..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: 'top' }}
        />

        {/* Animal Selection Chips */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Select Animal Type</Text>
          <View style={styles.chipGrid}>
            {animalOptions.map((option) => (
              <View key={option.value} style={{ flex: 1, minWidth: '45%' }}>
                <Chip
                  label={option.label}
                  selected={animalType === option.value}
                  onPress={() => setAnimalType(option.value)}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Upload Media Card */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>Upload Evidence</Text>
          <AnimatedPress
            onPress={pickMedia}
            style={[
              styles.pickerContainer,
              { backgroundColor: colors.background.tertiary, borderColor: colors.border.secondary },
            ]}
          >
            <Ionicons name="images" size={32} color={colors.primary} />
            <Text style={[styles.pickerTitle, { color: colors.text.primary }]}>
              {media.length > 0 ? `${media.length} Files Selected` : 'Attach Photos / Videos'}
            </Text>
            <Text style={[styles.pickerSub, { color: colors.text.muted }]}>
              Photos of physical condition help responders prepare diagnostic tools.
            </Text>
          </AnimatedPress>
        </View>

        {/* Action Button */}
        <Button
          variant="primary"
          onPress={handleSubmit}
          disabled={submitting}
          loading={submitting}
          style={styles.submitButton}
        >
          Submit Rescue Alert
        </Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[4],
  },
  fieldGroup: {
    gap: spacing[1.5],
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1.5],
  },
  pickerTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  pickerSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: spacing[3],
  },
  submitButton: {
    marginTop: spacing[3],
  },
});

export default SubmitRescueScreen;
