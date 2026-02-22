import { StatusBar } from 'expo-status-bar';
import OpenAI from 'openai';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../styles/Typography';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

export default function BookWormScreen() {
  const { theme } = useTheme(); 
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your Book Worm AI assistant. 📚\n\nI'm here to help you discover your next great read! What kind of books are you interested in?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText.trim()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are BookWorm, a cheerful and enthusiastic AI librarian assistant specializing ONLY in books, reading, and literature.

                      YOUR SPECIALTY: Book recommendations, literary discussions, reading advice, author information, genre exploration, and book-related topics.

                      IF USER ASKS NON-BOOK QUESTIONS:
                      Politely redirect them with responses like:
                      "I'm specifically designed to help with book recommendations and literary discussions! ⚯ While I'd love to help with [topic], that's outside my expertise. How about we find you a great book instead? What genres do you enjoy?"

                      FORMAT YOUR RESPONSES WITH:
                      - Use line breaks to separate ideas (add \\n\\n between paragraphs)
                      - Put book titles in *asterisks* for emphasis (e.g., *The Great Gatsby*)
                      - Put **important keywords** in double asterisks for bold (e.g., **highly recommended**)
                      - Keep responses well-organized and easy to read
                      - Use bullet points with "• " when listing multiple items
                      - Be warm, enthusiastic, and encouraging about reading

                      STAY ON TOPIC: Only discuss books, reading, literature, authors, and related topics. Cheerfully redirect any other queries back to books.`
          },
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: userMessage.content
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const fullContent = response.choices[0].message.content || 'Sorry, I couldn\'t generate a response.';
      
      // Add message with typing indicator
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullContent,
        isTyping: true
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      // Simulate typewriter effect
      await typewriterEffect(fullContent, messages.length + 1);

    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your connection and try again. 📚'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const typewriterEffect = async (fullText: string, messageIndex: number) => {
    const typingSpeed = 15;
    
    for (let i = 0; i <= fullText.length; i++) {
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[messageIndex]) {
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            content: fullText.slice(0, i),
            isTyping: i < fullText.length
          };
        }
        return newMessages;
      });
      
      if (i % 10 === 0) {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
      
      await new Promise(resolve => setTimeout(resolve, typingSpeed));
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: theme.backgroundPrimary,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'flex-end', // Align items to bottom
    },
    logo: {
      width: 32,
      height: 32,
      marginRight: 12,
      marginBottom: 4, // Adjust to align with title text baseline
      tintColor: theme.textTitle,
    },
    titleContainer: {
      flexDirection: 'column',
    },
    title: {
      ...typography.h2,
      color: theme.textTitle,
      marginBottom: 4,
    },
    subtitle: {
      ...typography.bodySmall,
      color: theme.textSecondary,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 8,
    },
    messageUser: {
      backgroundColor: theme.backgroundSecondary,
      padding: 14,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderBottomRightRadius: 4,
      marginBottom: 12,
      alignSelf: 'flex-end',
      maxWidth: '80%',
      shadowColor: theme.shadowLight,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    messageBot: {
      backgroundColor: theme.primaryMain,
      padding: 14,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderBottomLeftRadius: 4,
      marginBottom: 12,
      alignSelf: 'flex-start',
      maxWidth: '80%',
      shadowColor: theme.shadowMedium,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    userText: {
      ...typography.body,
      color: theme.textPrimary,
      lineHeight: 22,
    },
    botText: {
      ...typography.body,
      color: theme.textInverse,
      lineHeight: 22,
    },
    inputContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: Platform.OS === 'ios' ? 12 : 16,
      backgroundColor: theme.backgroundSecondary,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
      alignItems: 'flex-end',
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.borderMedium,
      marginRight: 8,
      maxHeight: 100,
    },
    input: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      ...typography.body,
      color: theme.textPrimary,
      minHeight: 44,
    },
    sendButton: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 24,
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.shadowMedium,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    sendButtonDisabled: {
      backgroundColor: theme.neutral400,
      opacity: 0.6,
    },
    sendButtonImage: {
      width: 22, // Slightly larger
      height: 22, // Slightly larger
      tintColor: theme.primaryMain,
    },
    typingIndicator: {
      alignSelf: 'flex-start',
      backgroundColor: theme.primaryMain,
      padding: 12,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderBottomLeftRadius: 4,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      shadowColor: theme.shadowMedium,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    typingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.textInverse,
      marginHorizontal: 2,
    },
    welcomeCard: {
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    welcomeTitle: {
      ...typography.h4,
      color: theme.textTitle,
      marginBottom: 8,
    },
    welcomeText: {
      ...typography.bodySmall,
      color: theme.textSecondary,
      lineHeight: 20,
    },
  });

  // Show welcome card only if there's just the initial message
  const showWelcome = messages.length === 1;

  return (
    <>
      <StatusBar style="dark" backgroundColor={theme.backgroundPrimary} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Image 
                source={require('../../assets/images/BookWormIcon.png')}
                style={styles.logo}
              />
              <View style={styles.titleContainer}>
                <Text style={styles.title}>BookWorm AI</Text>
                <Text style={styles.subtitle}>Your Personal Reading Companion</Text>
              </View>
            </View>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {showWelcome && (
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeTitle}>What I Can Help With:</Text>
                <Text style={styles.welcomeText}>
                  • Book recommendations tailored to your taste{'\n'}
                  • Discovering similar books to ones you love{'\n'}
                  • Finding books by mood, genre, or theme{'\n'}
                  • Discussing authors and literary styles{'\n'}
                  • Giving reading suggestions and advice
                </Text>
              </View>
            )}

            {messages.map((message, index) => (
              <View 
                key={index}
                style={message.role === 'user' ? styles.messageUser : styles.messageBot}
              >
                {message.role === 'user' ? (
                  <Text style={styles.userText}>
                    {message.content}
                  </Text>
                ) : (
                  <FormattedText 
                    content={message.content} 
                    style={styles.botText}
                    theme={theme}
                    isTyping={message.isTyping}
                  />
                )}
              </View>
            ))}
            
            {isLoading && <TypingIndicator theme={theme} styles={styles} />}
          </ScrollView>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about books..."
                placeholderTextColor={theme.textMuted}
                multiline
                maxLength={500}
                editable={!isLoading}
              />
            </View>
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Image 
                source={require('../../assets/images/PaperAirplane.png')}
                style={styles.sendButtonImage}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

// Component to render formatted text with markdown-style formatting
function FormattedText({ content, style, theme, isTyping }: { content: string; style: any; theme: any; isTyping?: boolean }) {
  const parseText = (text: string) => {
    const parts = [];
    let currentIndex = 0;
    
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (match.index > currentIndex) {
        parts.push({
          type: 'regular',
          content: text.substring(currentIndex, match.index)
        });
      }
      
      const matchedText = match[0];
      if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
        parts.push({
          type: 'bold',
          content: matchedText.slice(2, -2)
        });
      } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
        parts.push({
          type: 'italic',
          content: matchedText.slice(1, -1)
        });
      }
      
      currentIndex = match.index + matchedText.length;
    }
    
    if (currentIndex < text.length) {
      parts.push({
        type: 'regular',
        content: text.substring(currentIndex)
      });
    }
    
    return parts;
  };

  const parts = parseText(content);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.type === 'bold') {
          return (
            <Text key={index} style={{ fontWeight: '700' }}>
              {part.content}
            </Text>
          );
        } else if (part.type === 'italic') {
          return (
            <Text key={index} style={{ fontStyle: 'italic' }}>
              {part.content}
            </Text>
          );
        } else {
          return <Text key={index}>{part.content}</Text>;
        }
      })}
      {isTyping && <TypingCursor theme={theme} />}
    </Text>
  );
}

// Typing indicator component with animated dots
function TypingIndicator({ theme, styles }: { theme: any; styles: any }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, []);

  return (
    <View style={styles.typingIndicator}>
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
    </View>
  );
}

// Blinking cursor component
function TypingCursor({ theme }: { theme: any }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text style={{ opacity, color: theme.textInverse, fontWeight: 'bold' }}>
      |
    </Animated.Text>
  );
}