import { FontAwesome6 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  // 导航到预订页面
  const navigateToBookings = () => {
    router.push('/bookings');
  };
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.bookingButtonContainer}>
        <TouchableOpacity 
          style={styles.bookingButton}
          onPress={navigateToBookings}
          activeOpacity={0.7}
        >
          <FontAwesome6 
            name="clipboard-list" 
            size={20} 
            color={Colors[colorScheme ?? 'light'].buttonText}
            style={styles.bookingButtonIcon}
          />
          <ThemedText style={styles.bookingButtonText}>
            View reservation list
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  bookingButtonContainer: {
    marginTop: 32,
    marginBottom: 32,
    alignItems: 'center',
  },
  bookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookingButtonIcon: {
    marginRight: 8,
  },
  bookingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
