import { FontAwesome6 } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { BookingManager } from '../managers/BookingManager';
import { ShipInfo } from '../types/booking';

// Create global BookingManager instance
const bookingManager = new BookingManager({
  refreshOnLoad: true,
  cacheDuration: 30 * 60 * 1000 // 30 minutes
});

const BookingsScreen = () => {
  const [shipInfo, setShipInfo] = useState<ShipInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load ship information data
  const loadBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call BookingManager to load data
      const data = await bookingManager.loadBookings();
      
      // Save data to component state
      setShipInfo(data);
      
      // Print data in console
      console.log('Ship info data loaded:', data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load ship info';
      setError(errorMessage);
      console.error('Error loading ship info:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh ship information data
  const refreshBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call BookingManager to refresh data
      const data = await bookingManager.refreshBookings();
      
      // Update component state
      setShipInfo(data);
      
      // Print refreshed data in console
      console.log('Ship info data refreshed:', data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh ship info';
      setError(errorMessage);
      console.error('Error refreshing ship info:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts or re-appears
  useEffect(() => {
    // Register to BookingManager's state changes
    const unsubscribe = bookingManager.onStateChange((state) => {
      // Update component state when BookingManager's state changes
      if (state.shipInfo) {
        setShipInfo(state.shipInfo);
      }
      setIsLoading(state.isLoading);
      if (state.error) {
        setError(state.error.message);
      }
    });

    // Load data
    loadBookings();

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(parseInt(dateString) * 1000);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Render each segment item
  const renderSegmentItem = ({ item }: { item: any }) => {
    return (
      <ThemedView style={styles.segmentItem}>
        <ThemedText style={styles.segmentId}>Segment #{item.id}</ThemedText>
        
        <View style={styles.routeContainer}>
          <View style={styles.locationContainer}>
            <FontAwesome6 name="map-marker-alt" size={16} style={styles.locationIcon} />
            <View>
              <ThemedText style={styles.locationName}>{item.originAndDestinationPair.origin.displayName}</ThemedText>
              <ThemedText style={styles.locationCode}>{item.originAndDestinationPair.origin.code}</ThemedText>
            </View>
          </View>
          
          <View style={styles.arrowContainer}>
            <FontAwesome6 name="arrow-down" size={12} style={styles.arrowIcon} />
          </View>
          
          <View style={styles.locationContainer}>
            <FontAwesome6 name="map-marker-alt" size={16} style={styles.locationIcon} />
            <View>
              <ThemedText style={styles.locationName}>{item.originAndDestinationPair.destination.displayName}</ThemedText>
              <ThemedText style={styles.locationCode}>{item.originAndDestinationPair.destination.code}</ThemedText>
            </View>
          </View>
        </View>
      </ThemedView>
    );
  };

  // Render ship information
  const renderShipInfo = () => {
    if (!shipInfo) return null;

    return (
      <ThemedView style={styles.shipInfoContainer}>
        {/* Basic information */}
        <ThemedView style={styles.basicInfoContainer}>
          <View style={styles.infoRow}>
            <FontAwesome6 name="ship" size={16} style={styles.infoIcon} />
            <ThemedText style={styles.infoLabel}>Ship ID:</ThemedText>
            <ThemedText style={styles.infoValue}>{shipInfo.shipReference}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <FontAwesome6 name="clock" size={16} style={styles.infoIcon} />
            <ThemedText style={styles.infoLabel}>Expiry:</ThemedText>
            <ThemedText style={styles.infoValue}>{formatDate(shipInfo.expiryTime)}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <FontAwesome6 name="hourglass-half" size={16} style={styles.infoIcon} />
            <ThemedText style={styles.infoLabel}>Duration:</ThemedText>
            <ThemedText style={styles.infoValue}>{shipInfo.duration} minutes</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <FontAwesome6 name="ticket-alt" size={16} style={styles.infoIcon} />
            <ThemedText style={styles.infoLabel}>Ticket Status:</ThemedText>
            <ThemedText style={[styles.infoValue, shipInfo.canIssueTicketChecking ? styles.statusValid : styles.statusInvalid]}>
              {shipInfo.canIssueTicketChecking ? 'Valid' : 'Invalid'}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Segments list */}
        <ThemedView style={styles.segmentsContainer}>
          <ThemedText style={styles.segmentsTitle}>Segments Information</ThemedText>
          <FlatList
            data={shipInfo.segments}
            renderItem={renderSegmentItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.segmentsList}
          />
        </ThemedView>
      </ThemedView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Ship Information</ThemedText>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refreshBookings}
          disabled={isLoading}
        >
          <FontAwesome6 
            name="refresh" 
            size={18} 
            style={[styles.refreshIcon, isLoading && styles.refreshingIcon]}
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <FontAwesome6 name="exclamation-circle" size={48} style={styles.errorIcon} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadBookings}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : !shipInfo ? (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="ship" size={48} style={styles.emptyIcon} />
          <ThemedText style={styles.emptyText}>No Ship Information</ThemedText>
        </View>
      ) : (
        <FlatList
          data={[shipInfo]} // Wrap single object in array to adapt to FlatList
          renderItem={() => renderShipInfo()}
          keyExtractor={() => 'ship-info'}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
  },
  refreshIcon: {
    color: '#666',
  },
  refreshingIcon: {
    color: '#3b82f6',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  shipInfoContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  basicInfoContainer: {
    marginBottom: 16,
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: 8,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  statusValid: {
    color: '#10B981',
  },
  statusInvalid: {
    color: '#EF4444',
  },
  segmentsContainer: {
    borderRadius: 8,
    padding: 12,
  },
  segmentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  segmentsList: {
    gap: 12,
  },
  segmentItem: {
    borderRadius: 8,
    padding: 12,
  },
  segmentId: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  routeContainer: {
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  locationIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: 8,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationCode: {
    fontSize: 12,
    color: '#6B7280',
  },
  arrowContainer: {
    marginVertical: 4,
  },
  arrowIcon: {
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 16,
    color: '#ef4444',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 16,
    color: '#9ca3af',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});

export default BookingsScreen;