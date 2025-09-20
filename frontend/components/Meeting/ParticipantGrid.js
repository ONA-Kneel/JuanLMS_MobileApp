import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const ParticipantGrid = ({
  participants = [],
  localParticipant,
  isHost,
  onParticipantAction,
  layout = 'grid', // 'grid' or 'spotlight'
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showParticipantList, setShowParticipantList] = useState(false);

  // Combine local and remote participants
  const allParticipants = [
    ...(localParticipant ? [localParticipant] : []),
    ...participants.filter(p => p.userId !== localParticipant?.userId)
  ];

  const handleParticipantPress = (participant) => {
    if (layout === 'spotlight') {
      setSelectedParticipant(participant);
    }
  };

  const handleParticipantAction = (participant, action) => {
    if (onParticipantAction) {
      onParticipantAction(participant, action);
    }
  };

  const renderParticipantCard = (participant, index) => {
    const isLocal = participant.userId === localParticipant?.userId;
    const isSelected = selectedParticipant?.userId === participant.userId;
    const isMuted = participant.audioTrack?.enabled === false;
    const isVideoOn = participant.videoTrack?.enabled !== false;

    return (
      <TouchableOpacity
        key={participant.userId || index}
        style={[
          styles.participantCard,
          isSelected && styles.selectedParticipant,
          layout === 'spotlight' && styles.spotlightCard,
        ]}
        onPress={() => handleParticipantPress(participant)}
        activeOpacity={0.8}
      >
        {/* Video Container */}
        <View style={styles.videoContainer}>
          {isVideoOn ? (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>
                {participant.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          ) : (
            <View style={styles.noVideoContainer}>
              <Icon name="video-off" size={32} color="#9CA3AF" />
            </View>
          )}
          
          {/* Video Off Overlay */}
          {!isVideoOn && (
            <View style={styles.videoOffOverlay}>
              <Icon name="video-off" size={20} color="#fff" />
            </View>
          )}
        </View>

        {/* Participant Info */}
        <View style={styles.participantInfo}>
          <Text style={styles.participantName} numberOfLines={1}>
            {participant.name || 'Unknown User'}
            {isLocal && ' (You)'}
          </Text>
          
          {/* Status Indicators */}
          <View style={styles.statusIndicators}>
            {isMuted && (
              <View style={styles.statusIndicator}>
                <Icon name="microphone-off" size={12} color="#DC2626" />
              </View>
            )}
            {isHost && participant.userId === localParticipant?.userId && (
              <View style={styles.statusIndicator}>
                <Icon name="crown" size={12} color="#F59E0B" />
              </View>
            )}
            {participant.isSpeaking && (
              <View style={styles.statusIndicator}>
                <Icon name="microphone" size={12} color="#10B981" />
              </View>
            )}
          </View>
        </View>

        {/* Action Menu (Host only) */}
        {isHost && !isLocal && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowParticipantList(true)}
          >
            <Icon name="dots-vertical" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderGridLayout = () => {
    const numColumns = Math.min(3, allParticipants.length);
    const cardWidth = (width - 32 - (numColumns - 1) * 8) / numColumns;
    const cardHeight = cardWidth * 0.75;

    return (
      <ScrollView
        style={styles.gridContainer}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {allParticipants.map((participant, index) => (
            <View
              key={participant.userId || index}
              style={[
                styles.gridItem,
                { width: cardWidth, height: cardHeight }
              ]}
            >
              {renderParticipantCard(participant, index)}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderSpotlightLayout = () => {
    const mainParticipant = selectedParticipant || allParticipants[0];
    const otherParticipants = allParticipants.filter(
      p => p.userId !== mainParticipant?.userId
    );

    return (
      <View style={styles.spotlightContainer}>
        {/* Main participant */}
        {mainParticipant && (
          <View style={styles.mainParticipant}>
            {renderParticipantCard(mainParticipant, 0)}
          </View>
        )}

        {/* Other participants */}
        {otherParticipants.length > 0 && (
          <ScrollView
            horizontal
            style={styles.otherParticipants}
            showsHorizontalScrollIndicator={false}
          >
            {otherParticipants.map((participant, index) => (
              <View
                key={participant.userId || index + 1}
                style={styles.otherParticipantItem}
              >
                {renderParticipantCard(participant, index + 1)}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  if (allParticipants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="account-group" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>No participants yet</Text>
        <Text style={styles.emptySubtext}>
          Waiting for others to join...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {layout === 'grid' ? renderGridLayout() : renderSpotlightLayout()}
      
      {/* Participant List Modal */}
      {showParticipantList && (
        <ParticipantListModal
          participants={allParticipants}
          isHost={isHost}
          onClose={() => setShowParticipantList(false)}
          onAction={handleParticipantAction}
        />
      )}
    </View>
  );
};

// Participant List Modal Component
const ParticipantListModal = ({ participants, isHost, onClose, onAction }) => {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Participants ({participants.length})</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {participants.map((participant, index) => (
            <View key={participant.userId || index} style={styles.participantListItem}>
              <View style={styles.participantListInfo}>
                <Text style={styles.participantListName}>
                  {participant.name || 'Unknown User'}
                </Text>
                <Text style={styles.participantListRole}>
                  {participant.role || 'Participant'}
                </Text>
              </View>
              
              {isHost && (
                <View style={styles.participantListActions}>
                  <TouchableOpacity
                    style={styles.listActionButton}
                    onPress={() => onAction(participant, 'mute')}
                  >
                    <Icon name="microphone-off" size={16} color="#DC2626" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.listActionButton}
                    onPress={() => onAction(participant, 'remove')}
                  >
                    <Icon name="account-remove" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    flex: 1,
  },
  gridContent: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    marginBottom: 8,
  },
  participantCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedParticipant: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  spotlightCard: {
    height: '100%',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
  },
  noVideoContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOffOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  participantInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: 4,
  },
  statusIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 2,
  },
  actionButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  spotlightContainer: {
    flex: 1,
  },
  mainParticipant: {
    flex: 1,
    margin: 16,
  },
  otherParticipants: {
    maxHeight: 120,
    paddingHorizontal: 16,
  },
  otherParticipantItem: {
    width: 80,
    height: 60,
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: height * 0.6,
    width: width * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    maxHeight: height * 0.4,
  },
  participantListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  participantListInfo: {
    flex: 1,
  },
  participantListName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  participantListRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  participantListActions: {
    flexDirection: 'row',
    gap: 8,
  },
  listActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
});

export default ParticipantGrid;
