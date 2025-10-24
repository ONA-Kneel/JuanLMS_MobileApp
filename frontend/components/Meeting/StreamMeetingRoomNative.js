import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import {
	StreamVideo,
	StreamVideoClient,
	Call,
	StreamCall,
	CallContent,
} from '@stream-io/video-react-native-sdk';
import InCallManager from 'react-native-incall-manager';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Generate call ID from meeting data
const generateCallId = (meetingData) => {
  if (meetingData?.meetingId) return String(meetingData.meetingId);
  if (meetingData?._id) return String(meetingData._id);
  if (meetingData?.title) return String(meetingData.title).replace(/\s+/g, '-').toLowerCase();
  return `meeting-${Date.now()}`;
};

// A minimal Stream video meeting room for React Native.
// Props:
// - isOpen: boolean (controls modal visibility)
// - onClose: function
// - onLeave: function
// - meetingData: object with { title, _id/meetingId, roomUrl? }
// - credentials: { apiKey, token, userId, callId? }
// - isHost: boolean
// - hostUserId: string
// - currentUser: { name, email }
export default function StreamMeetingRoomNative({
	isOpen,
	onClose,
	onLeave,
	meetingData,
	credentials,
	isHost = false,
	hostUserId,
	currentUser,
}) {
	const [client, setClient] = useState(null);
	const [call, setCall] = useState(null);
	const [isJoining, setIsJoining] = useState(false);
	const [error, setError] = useState('');
	const [isOffline, setIsOffline] = useState(false);
	
	// Credential fetching state
	const [streamCredentials, setStreamCredentials] = useState(null);
	const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);

	// Fetch Stream credentials from backend
	useEffect(() => {
		const fetchCredentials = async () => {
			if (!isOpen || !meetingData) return;
			
			setIsLoadingCredentials(true);
			try {
				const callId = generateCallId(meetingData);
				
				const token = await AsyncStorage.getItem('jwtToken');
				const response = await fetch('https://juanlms-webapp-server.onrender.com/api/meetings/stream-credentials', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					body: JSON.stringify({ callId })
				});
				
				const data = await response.json();
				
				if (data.success) {
					setStreamCredentials(data);
					console.log('[STREAM-CREDS] Successfully fetched credentials from backend');
				} else {
					console.error('[STREAM-CREDS] Failed to fetch credentials:', data.message);
					setError(data.message || 'Failed to get Stream credentials');
				}
			} catch (error) {
				console.error('[STREAM-CREDS] Error fetching credentials:', error);
				setError('Failed to connect to Stream service');
			} finally {
				setIsLoadingCredentials(false);
			}
		};
		
		fetchCredentials();
	}, [isOpen, meetingData]);

	// Use provided credentials or fetched credentials
	const finalCredentials = useMemo(() => {
		return credentials || streamCredentials;
	}, [credentials, streamCredentials]);

	const apiKey = finalCredentials?.apiKey;
	const userToken = finalCredentials?.token;
	const userId = finalCredentials?.userId;

	const resolvedCallId = useMemo(() => {
		if (finalCredentials?.callId) return String(finalCredentials.callId);
		if (meetingData?.meetingId) return String(meetingData.meetingId);
		if (meetingData?._id) return String(meetingData._id);
		try {
			if (meetingData?.roomUrl) {
				const url = new URL(meetingData.roomUrl);
				const path = url.pathname || '';
				const name = path.startsWith('/') ? path.slice(1) : path;
				if (name) return decodeURIComponent(name);
			}
		} catch (e) {
			console.debug('StreamMeetingRoomNative: failed to parse roomUrl', e);
		}
		return generateCallId(meetingData);
	}, [finalCredentials?.callId, meetingData]);

	const userInfo = useMemo(() => {
		// Use the generated stream credentials userInfo, with fallback
		const streamUserInfo = finalCredentials?.userInfo;
		if (streamUserInfo && streamUserInfo.name) {
			console.log('[StreamMeetingRoomNative] Using userInfo from backend:', streamUserInfo);
			return streamUserInfo;
		}
		
		// Fallback: get user info from currentUser prop
		const displayName = currentUser?.name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'User';
		const fallbackUserInfo = { 
			id: String(userId || 'anonymous_user'), 
			name: String(displayName) 
		};
		console.log('[StreamMeetingRoomNative] Using fallback userInfo:', fallbackUserInfo);
		return fallbackUserInfo;
	}, [finalCredentials, currentUser, userId]);

	const cleanup = useCallback(async (c, cl) => {
		try { if (cl) await cl.leave(); } catch {}
		try { if (c) await c.disconnectUser(); } catch {}
	}, []);

	useEffect(() => {
		let cancelled = false;
		let netUnsubscribe = null;
		const join = async () => {
			if (!isOpen) return;
			if (isLoadingCredentials) {
				setError('Loading Stream credentials...');
				return;
			}
			if (!finalCredentials) {
				setError('Failed to load Stream credentials');
				return;
			}
			if (!apiKey || !userToken || !userId) {
				setError('Missing Stream credentials');
				return;
			}
			if (!resolvedCallId) {
				setError('Missing callId');
				return;
			}
			setIsJoining(true);
			setError('');
			try {
				// Start audio routing like a real call (earpiece/speaker, audio focus)
				try { InCallManager.start({ media: 'audio' }); InCallManager.setForceSpeakerphoneOn(true); } catch {}

				// Track connectivity
				netUnsubscribe = NetInfo.addEventListener(state => {
					setIsOffline(!(state?.isConnected && state?.isInternetReachable !== false));
				});

				const c = new StreamVideoClient({ apiKey });
				console.log('[StreamMeetingRoomNative] Connecting user with info:', userInfo);
				await c.connectUser(userInfo, userToken);
				if (cancelled) return;
                const callInstance = c.call('default', resolvedCallId);
                
                // Ensure mic and camera are disabled at start for the local user
                try { 
                    await callInstance.microphone?.disable?.(); 
                    console.log('[StreamMeetingRoomNative] Microphone disabled before join');
                } catch {}
                try { 
                    await callInstance.camera?.disable?.(); 
                    console.log('[StreamMeetingRoomNative] Camera disabled before join');
                } catch {}
                
                await callInstance.join({ create: true });
                
                // Double-check post-join that tracks remain disabled
                try { 
                    await callInstance.microphone?.disable?.(); 
                    console.log('[StreamMeetingRoomNative] Microphone disabled after join');
                } catch {}
                try { 
                    await callInstance.camera?.disable?.(); 
                    console.log('[StreamMeetingRoomNative] Camera disabled after join');
                } catch {}
                
                console.log('[StreamMeetingRoomNative] User joined with mic muted and camera off');
                
				if (cancelled) {
					await cleanup(c, callInstance);
					return;
				}
				setClient(c);
				setCall(callInstance);
			} catch (e) {
				setError(e?.message || 'Failed to join the call');
			} finally {
				if (!cancelled) setIsJoining(false);
			}
		};
		join();
		return () => {
			cancelled = true;
			cleanup(client, call);
			try { if (netUnsubscribe) netUnsubscribe(); } catch {}
		};
	}, [apiKey, userToken, userId, resolvedCallId, userInfo, isOpen, finalCredentials, isLoadingCredentials]);

	// Host presence detection removed - always show meeting content

	// If call ends (host clicked end for everyone), auto leave/redirect
	useEffect(() => {
		if (!call) return;
		let endedInterval;
		try {
			if (typeof call.on === 'function') {
				call.on('call.ended', handleLeave);
				call.on('ended', handleLeave);
			}
		} catch (err) { void err; }
		endedInterval = setInterval(() => {
			try {
				const ended = !!(call.state?.call?.ended || call.state?.ended || call.state?.status === 'ended');
				if (ended) {
					clearInterval(endedInterval);
					handleLeave();
				}
			} catch (err) { void err; }
		}, 1500);
		return () => {
			clearInterval(endedInterval);
			try { if (typeof call.off === 'function') { call.off('call.ended', handleLeave); call.off('ended', handleLeave); } } catch (err) { void err; }
		};
	}, [handleLeave, call]);

	const handleLeave = useCallback(async () => {
		await cleanup(client, call);
		try { InCallManager.stop(); } catch {}
		if (onLeave) onLeave();
		if (onClose) onClose();
	}, [cleanup, client, call, onLeave, onClose]);

	if (!isOpen) return null;

	return (
		<Modal visible={isOpen} animationType="slide" onRequestClose={handleLeave} transparent>
			<View style={styles.overlay}>
				<View style={styles.container}>
					<View style={styles.header}>
						<Text style={styles.title}>{meetingData?.title || `Call ${resolvedCallId}`}</Text>
						<TouchableOpacity onPress={handleLeave} style={styles.closeButton}>
							<Text style={styles.closeText}>Leave</Text>
						</TouchableOpacity>
					</View>
					{isOffline && (
						<View style={styles.offlineBanner}>
							<Text style={styles.offlineText}>You are offline. Reconnecting…</Text>
						</View>
					)}
					<View style={styles.body}>
						{error ? (
							<View style={styles.center}>
								<Text style={styles.errorText}>{error}</Text>
								<TouchableOpacity onPress={handleLeave} style={styles.primaryButton}>
									<Text style={styles.primaryText}>Close</Text>
								</TouchableOpacity>
							</View>
						) : isJoining || !client || !call ? (
							<View style={styles.center}>
								<ActivityIndicator size="large" color="#2563EB" />
								<Text style={styles.infoText}>Joining meeting...</Text>
							</View>
						) : (
							<StreamVideo client={client}>
								<StreamCall call={call}>
									<CallContent />
								</StreamCall>
							</StreamVideo>
						)}
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.6)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		backgroundColor: 'white',
		width: '95%',
		height: '85%',
		borderRadius: 12,
		overflow: 'hidden',
	},
	header: {
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111827',
	},
	closeButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		backgroundColor: '#DC2626',
		borderRadius: 8,
	},
	closeText: {
		color: 'white',
		fontWeight: '600',
	},
	body: {
		flex: 1,
		backgroundColor: '#000',
	},
	waitingHost: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#1a1a1a',
	},
	waitingCard: {
		backgroundColor: '#2a2a2a',
		borderRadius: 16,
		padding: 32,
		alignItems: 'center',
		maxWidth: 300,
	},
	waitingIcon: {
		fontSize: 48,
		marginBottom: 16,
	},
	waitingTitle: {
		color: '#fff',
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 8,
		textAlign: 'center',
	},
	waitingSub: {
		color: '#9CA3AF',
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
	},
	offlineBanner: {
		backgroundColor: '#ef4444',
		paddingVertical: 6,
		paddingHorizontal: 12,
	},
	offlineText: {
		color: 'white',
		textAlign: 'center',
		fontWeight: '600',
	},
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'white',
	},
	infoText: {
		marginTop: 12,
		color: '#374151',
	},
	errorText: {
		color: '#DC2626',
		marginBottom: 12,
		textAlign: 'center',
		paddingHorizontal: 16,
	},
	primaryButton: {
		backgroundColor: '#2563EB',
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 8,
	},
	primaryText: {
		color: 'white',
		fontWeight: '600',
	},
});


