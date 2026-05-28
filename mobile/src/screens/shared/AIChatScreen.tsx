import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { AnimatedPress } from '../../components/AnimatedPress';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function AIChatScreen() {
  const colors = useColors();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I am VetsCue AI, your stray welfare assistant. How can I help you coordinate rescues or guide you through veterinary first-aid today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  const quickPrompts = [
    "🐾 How do I report a trauma case?",
    "🩹 First aid for stray dog wound?",
    "🚑 Tracking assigned ambulance?",
    "💳 Crowdfunding campaign approvals?",
  ];

  const getAiResponse = (userQuery: string): string => {
    const q = userQuery.toLowerCase();
    if (q.includes('report') || q.includes('trauma') || q.includes('case')) {
      return "To report a case, return to the Citizen Home dashboard, tap '🚨 REPORT STRAY ANIMAL', upload a photo of the animal, capture your coordinates via GPS, and submit. The nearest NGO will be pinged instantly!";
    }
    if (q.includes('first aid') || q.includes('wound') || q.includes('injury')) {
      return "For minor wounds, clean the area from a safe distance using clean water or saline. Do NOT apply human ointments. Keep the animal calm and in shade. If the animal is aggressive, do not force contact — wait for NGO dispatches.";
    }
    if (q.includes('track') || q.includes('ambulance') || q.includes('fleet')) {
      return "Once a case is admitted and escalated by an NGO, the assigned Hospital dispatches fleet vehicles. You can view the live ETA and ambulance routes on the interactive radar maps in the Case Detail view!";
    }
    if (q.includes('crowdfund') || q.includes('fundraiser') || q.includes('approval')) {
      return "NGOs can request crowdfunding sponsorships for critical care by uploading clinical invoices. Admin coordinators audit medical bills on the Approvals Desk before activating campaigns on the citizen feed.";
    }
    return "I am scanning our stray rescue protocol directories for '" + userQuery + "'. For immediate veterinary trauma assistance, please submit an official VetsCue report or contact our emergency coordinate helpline.";
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setTyping(true);

    setTimeout(() => {
      const aiReplyText = getAiResponse(text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiReplyText,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTyping(false);
    }, 1000);
  };

  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, typing]);

  return (
    <Screen
      scrollable={false}
      title="VetsCue AI"
      subtitle="Immediate veterinary rescue protocols & emergency coordinator FAQs"
      style={{ backgroundColor: colors.background.primary }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Quick Prompts Chips */}
        <View style={styles.quickPromptsRow}>
          {quickPrompts.map((prompt) => (
            <AnimatedPress
              key={prompt}
              onPress={() => handleSend(prompt.slice(2))}
              style={[styles.promptChip, { backgroundColor: colors.background.secondary }]}
            >
              <Text style={[styles.promptChipText, { color: colors.text.secondary }]}>{prompt}</Text>
            </AnimatedPress>
          ))}
        </View>

        {/* Chats FlatList */}
        <View style={{ flex: 1, marginVertical: spacing[2] }}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isAi = item.sender === 'ai';
              return (
                <View style={[styles.messageWrapper, isAi ? styles.aiWrapper : styles.userWrapper]}>
                  {isAi && (
                    <View style={[styles.aiAvatar, { backgroundColor: `${colors.primary}12` }]}>
                      <Ionicons name="sparkles" size={13} color={colors.primary} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.msgBubble,
                      {
                        backgroundColor: isAi
                          ? colors.background.secondary
                          : colors.primary,
                        borderBottomLeftRadius: isAi ? 0 : borderRadius.xl,
                        borderBottomRightRadius: isAi ? borderRadius.xl : 0,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.msgText,
                        { color: isAi ? colors.text.primary : colors.background.primary },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={
              typing ? (
                <View style={[styles.messageWrapper, styles.aiWrapper]}>
                  <View style={[styles.aiAvatar, { backgroundColor: `${colors.primary}12` }]}>
                    <Ionicons name="sparkles" size={13} color={colors.primary} />
                  </View>
                  <View style={[styles.msgBubble, { backgroundColor: colors.background.secondary, borderBottomLeftRadius: 0 }]}>
                    <Text style={{ color: colors.text.secondary, fontStyle: 'italic', fontSize: 12 }}>
                      VetsCue AI is writing...
                    </Text>
                  </View>
                </View>
              ) : null
            }
          />
        </View>

        {/* Input Bar */}
        <Card variant="glass" style={styles.inputContainerCard}>
          <TextInput
            placeholder="Type your emergency query..."
            placeholderTextColor={colors.text.muted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend(inputText)}
            style={[styles.textInput, { color: colors.text.primary }]}
          />
          <AnimatedPress
            onPress={() => handleSend(inputText)}
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="send" size={16} color={colors.background.primary} />
          </AnimatedPress>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  quickPromptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  promptChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.md,
  },
  promptChipText: {
    fontSize: 11.5,
    fontFamily: typography.fontFamily.regular,
  },
  listContent: {
    gap: spacing[4],
    paddingBottom: spacing[4],
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2.5],
    maxWidth: '82%',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  aiAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBubble: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
  },
  msgText: {
    fontSize: 13.5,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 18,
  },
  inputContainerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  textInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: spacing[3],
    fontSize: 13.5,
    fontFamily: typography.fontFamily.regular,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AIChatScreen;
