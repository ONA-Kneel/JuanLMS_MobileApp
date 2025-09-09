import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import {
	StreamVideo,
	StreamVideoClient,
	Call,
	CallContent,
} from '@stream-io/video-react-native-sdk';
import InCallManager from 'react-native-incall-manager';
import NetInfo from '@react-native-community/netinfo';

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

	const apiKey = credentials?.apiKey;
	const userToken = credentials?.token;
	const userId = credentials?.userId;
	const [isOffline, setIsOffline] = useState(false);

	const resolvedCallId = useMemo(() => {
		if (credentials?.callId) return String(credentials.callId);
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
			// ignore url parse error
		}
		return '';
	}, [credentials?.callId, meetingData]);

	const userInfo = useMemo(() => {
		const displayName = currentUser?.name || userId || 'User';
		return { id: String(userId || 'anonymous_user'), name: String(displayName) };
	}, [currentUser?.name, userId]);

	const cleanup = useCallback(async (c, cl) => {
		try { if (cl) await cl.leave(); } catch {}
		try { if (c) await c.disconnectUser(); } catch {}
	}, []);

	useEffect(() => {
		let cancelled = false;
		let netUnsubscribe = null;
		const join = async () => {
			if (!isOpen) return;
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
				await c.connectUser(userInfo, userToken);
				if (cancelled) return;
				const callInstance = c.call('default', resolvedCallId);
				await callInstance.join({ create: true });
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
	}, [apiKey, userToken, userId, resolvedCallId, userInfo, isOpen]);

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
								<Call call={call}>
									<CallContent />
								</Call>
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


