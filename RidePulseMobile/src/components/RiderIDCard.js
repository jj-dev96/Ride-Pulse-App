import React, { useEffect, useState } from 'react';
import { View, Text, Image, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import firestore from '@react-native-firebase/firestore';

const RiderIDCard = ({ visible, onClose, userId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const unsub = firestore()
      .collection('users')
      .doc(userId)
      .collection('profile')
      .onSnapshot(snapshot => {
        if (!snapshot.empty) {
          setProfile(snapshot.docs[0].data());
        }
        setLoading(false);
      });
    return () => unsub();
  }, [userId]);

  // Rider ID generation logic
  useEffect(() => {
    if (profile && !profile.riderId) {
      const year = new Date().getFullYear();
      const unique = Math.floor(100000 + Math.random() * 900000);
      const riderId = `RP-${year}-${unique}`;
      firestore()
        .collection('users')
        .doc(userId)
        .collection('profile')
        .doc('main')
        .set({ ...profile, riderId }, { merge: true });
    }
  }, [profile, userId]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={{ fontSize: 20, color: '#888' }}>✕</Text>
          </TouchableOpacity>
          {loading || !profile ? (
            <ActivityIndicator color="#FFD700" style={{ margin: 40 }} />
          ) : (
            <View style={styles.row}>
              {/* Profile Image or Initial */}
              {profile.profileImage ? (
                <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
              ) : (
                <View style={[styles.profileImg, { backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' }]}> 
                  <Text style={{ fontSize: 48, color: '#222', fontWeight: 'bold' }}>{profile.fullName?.[0]?.toUpperCase() || '?'}</Text>
                </View>
              )}
              {/* Details */}
              <View style={styles.details}>
                <Text style={styles.name}>{profile.fullName || 'Not Provided'}</Text>
                <Text style={styles.label}>Rider ID: <Text style={styles.value}>{profile.riderId || 'Not Provided'}</Text></Text>
                <Text style={styles.label}>License: <Text style={styles.value}>{profile.licenseNumber || 'Not Provided'}</Text></Text>
                <Text style={styles.label}>Vehicle: <Text style={styles.value}>{profile.vehicleNumber || 'Not Provided'}</Text></Text>
                <Text style={styles.label}>Model: <Text style={styles.value}>{profile.vehicleModel || 'Not Provided'}</Text></Text>
                <Text style={styles.label}>Age: <Text style={styles.value}>{profile.age || 'Not Provided'}</Text></Text>
                <Text style={styles.label}>DOB: <Text style={styles.value}>{profile.dob || 'Not Provided'}</Text></Text>
                <Text style={styles.label}>Member Since: <Text style={styles.value}>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Not Provided'}</Text></Text>
                <Text style={styles.label}>Role: <Text style={styles.value}>{profile.role || 'Not Provided'}</Text></Text>
                {profile.profileCompleted ? (
                  <Text style={styles.verified}>✔ Verified Rider</Text>
                ) : (
                  <Text style={styles.incomplete}>Incomplete Profile</Text>
                )}
                {!profile.profileCompleted && (
                  <TouchableOpacity style={styles.completeBtn} onPress={onClose}>
                    <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>Complete Profile</Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* QR Code */}
              <View style={styles.qrWrap}>
                <QRCode
                  value={JSON.stringify({
                    riderId: profile.riderId,
                    fullName: profile.fullName,
                    licenseNumber: profile.licenseNumber,
                  })}
                  size={56}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 24,
    width: 340,
    maxWidth: '95%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
  },
  profileImg: {
    width: 100,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    marginRight: 18,
  },
  details: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#FFD700',
    marginBottom: 6,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 2,
  },
  value: {
    color: '#fff',
    fontWeight: 'bold',
  },
  verified: {
    color: 'green',
    fontWeight: 'bold',
    marginTop: 8,
  },
  incomplete: {
    color: 'orange',
    fontWeight: 'bold',
    marginTop: 8,
  },
  completeBtn: {
    marginTop: 8,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignSelf: 'flex-start',
  },
  qrWrap: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RiderIDCard;
