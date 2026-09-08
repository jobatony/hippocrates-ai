import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { Question, generateMockSession } from '../data/mockQuestions';
import Icon from 'react-native-vector-icons/Feather';

const shuffleArray = (array: any[]) => array.sort(() => Math.random() - 0.5);

export const QuizScreen = ({ navigation }: any) => {
  const [activePool, setActivePool] = useState<Question[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  
  // Maps question ID to consecutive correct answers
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<Record<string, number>>({});
  
  // State for immediate feedback
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    startSession();
  }, []);

  const startSession = () => {
    const session = generateMockSession();
    setActivePool(shuffleArray([...session]));
    setCompletedCount(0);
    setConsecutiveCorrect({});
    pickNextQuestion(session);
  };

  const pickNextQuestion = (pool: Question[]) => {
    if (pool.length === 0) {
      setCurrentQuestion(null);
      return;
    }
    // Pick random question from active pool
    const nextQ = pool[Math.floor(Math.random() * pool.length)];
    setCurrentQuestion(nextQ);
    setShuffledOptions(shuffleArray([...nextQ.options]));
    setIsAnswered(false);
    setSelectedOption(null);
  };

  const handleSelectOption = (option: string) => {
    if (isAnswered || !currentQuestion) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    const correct = option === currentQuestion.correctOption;
    setIsCorrect(correct);
    
    const currentQId = currentQuestion.id;
    
    setConsecutiveCorrect(prev => {
      const currentStreak = prev[currentQId] || 0;
      const newStreak = correct ? currentStreak + 1 : 0;
      return { ...prev, [currentQId]: newStreak };
    });
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    
    const streak = consecutiveCorrect[currentQuestion.id] || 0;
    let newPool = [...activePool];
    
    // If they just got it right and now it's 3 times total (we check against 3 since state updated in handleSelect)
    if (streak >= 3) {
      newPool = newPool.filter(q => q.id !== currentQuestion.id);
      setCompletedCount(prev => prev + 1);
    }
    
    setActivePool(newPool);
    pickNextQuestion(newPool);
  };

  if (activePool.length === 0 && completedCount === 0) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (activePool.length === 0 && completedCount > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.headerText}>Session Complete!</Text>
          <Text style={styles.subText}>You reviewed {completedCount} questions today.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.btnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStreakNeeded = currentQuestion ? (consecutiveCorrect[currentQuestion.id] || 0) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Icon name="x" size={24} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={styles.progressText}>{completedCount} / 120</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${(completedCount / 120) * 100}%` }]} />
      </View>

      {currentQuestion && (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.qLabel}>Question {currentQuestion.id.replace('q_', '')}</Text>
            {currentQuestion.topic && (
              <View style={styles.topicChip}>
                <Text style={styles.topicText}>{currentQuestion.topic}</Text>
              </View>
            )}
            <Text style={styles.qText}>{currentQuestion.text}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {shuffledOptions.map((opt, idx) => {
              let optStyle = styles.optionCard;
              let txtStyle = styles.optionText;
              let icon = null;

              if (isAnswered) {
                if (opt === currentQuestion.correctOption) {
                  optStyle = [styles.optionCard, styles.optionCorrect];
                  txtStyle = [styles.optionText, { color: colors.correct }];
                  icon = <Icon name="check-circle" size={20} color={colors.correct} />;
                } else if (opt === selectedOption) {
                  optStyle = [styles.optionCard, styles.optionWrong];
                  txtStyle = [styles.optionText, { color: colors.error }];
                  icon = <Icon name="x-circle" size={20} color={colors.error} />;
                }
              } else if (opt === selectedOption) {
                optStyle = [styles.optionCard, styles.optionSelected];
              }

              return (
                <TouchableOpacity 
                  key={idx} 
                  style={optStyle} 
                  onPress={() => handleSelectOption(opt)}
                  activeOpacity={0.7}
                >
                  <Text style={txtStyle}>{opt}</Text>
                  {icon}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Consecutive Correct Counter */}
          <View style={styles.consecutiveContainer}>
            <View style={styles.dotsRow}>
              {[1, 2, 3].map(dot => (
                <View 
                  key={dot} 
                  style={[styles.dot, currentStreakNeeded >= dot && styles.dotFilled]} 
                />
              ))}
            </View>
            <Text style={styles.dotLabel}>Get it right 3 times to complete</Text>
          </View>

          {isAnswered && (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  progressText: { color: colors.onSurfaceVariant, fontSize: 16, fontWeight: '500' },
  progressBarBg: { height: 4, backgroundColor: colors.surfaceContainerHighest, width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: colors.primaryContainer },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: colors.surfaceContainer, borderRadius: 16, padding: 24, marginBottom: 24 },
  qLabel: { color: colors.outline, fontSize: 12, marginBottom: 8 },
  topicChip: { backgroundColor: colors.secondaryContainer, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginBottom: 12 },
  topicText: { color: colors.secondary, fontSize: 12, fontWeight: '600' },
  qText: { color: colors.onSurface, fontSize: 20, lineHeight: 28 },
  optionsContainer: { gap: 12, marginBottom: 24 },
  optionCard: { backgroundColor: colors.surfaceContainerHigh, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionSelected: { backgroundColor: colors.surfaceContainer, borderColor: colors.primary },
  optionCorrect: { backgroundColor: colors.correctContainer, borderColor: colors.correctContainer },
  optionWrong: { backgroundColor: colors.errorContainer, borderColor: colors.errorContainer },
  optionText: { color: colors.onSurface, fontSize: 16, flex: 1 },
  consecutiveContainer: { alignItems: 'center', marginTop: 'auto', marginBottom: 20 },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.outlineVariant },
  dotFilled: { backgroundColor: colors.primary },
  dotLabel: { color: colors.outline, fontSize: 12 },
  nextBtn: { backgroundColor: colors.primaryContainer, padding: 16, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { color: '#fcf6ff', fontSize: 16, fontWeight: 'bold' },
  headerText: { fontSize: 24, color: colors.onSurface, fontWeight: 'bold', marginBottom: 8 },
  subText: { fontSize: 16, color: colors.onSurfaceVariant, marginBottom: 24 },
  btn: { backgroundColor: colors.primaryContainer, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fcf6ff', fontWeight: 'bold', fontSize: 16 }
});
