<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { View, Text, Image, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getFirestore, collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { app } from '../config/firebase';

const RiderIDCard = ({ visible, onClose, userId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const db = getFirestore(app);
    const profileRef = collection(doc(collection(db, 'users'), userId), 'profile');
    const unsub = onSnapshot(profileRef, (snapshot) => {
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
      const db = getFirestore(app);
      const mainProfileRef = doc(collection(doc(collection(db, 'users'), userId), 'profile'), 'main');
      setDoc(mainProfileRef, { ...profile, riderId }, { merge: true });
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
=======
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const RiderIDCard = ({ visible, onClose, user, onCompleteProfile }) => {
    if (!user) return null;

    const profile = user.profile || {};
    const isProfileComplete = !!profile.profileCompleted;

    const getInitials = (name) => {
        if (!name) return 'RP';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name) => {
        const colors = ['#FFD700', '#FF8C00', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
        if (!name) return colors[0];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const qrValue = JSON.stringify({
        id: profile.riderId || user.id,
        name: profile.fullName || user.name,
        license: profile.licenseNumber || 'N/A'
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'Not Provided';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.cardContainer}
                >
                    <LinearGradient
                        colors={['#1F2937', '#111827']}
                        style={styles.card}
                    >
                        {/* Header Decoration */}
                        <View style={styles.cardHeader}>
                            <View style={styles.logoRow}>
                                <View style={styles.logoIcon}>
                                    <FontAwesome5 name="motorcycle" size={14} color="black" />
                                </View>
                                <Text style={styles.logoText}>RIDEPULSE ID</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.mainContent}>
                            {/* LEFT: Profile Image */}
                            <View style={styles.leftColumn}>
                                <View style={[
                                    styles.imageContainer,
                                    !profile.profileImage && { backgroundColor: getAvatarColor(profile.fullName || user.name) }
                                ]}>
                                    {profile.profileImage ? (
                                        <Image
                                            source={{ uri: profile.profileImage }}
                                            style={styles.profileImage}
                                        />
                                    ) : (
                                        <Text style={styles.initialsText}>
                                            {getInitials(profile.fullName || user.name)}
                                        </Text>
                                    )}
                                </View>

                                {/* Verification Badge */}
                                <View style={[
                                    styles.badge,
                                    isProfileComplete ? styles.verifiedBadge : styles.incompleteBadge
                                ]}>
                                    <MaterialIcons
                                        name={isProfileComplete ? "verified" : "warning"}
                                        size={12}
                                        color={isProfileComplete ? "#10B981" : "#F59E0B"}
                                    />
                                    <Text style={[
                                        styles.badgeText,
                                        isProfileComplete ? { color: '#10B981' } : { color: '#F59E0B' }
                                    ]}>
                                        {isProfileComplete ? "VERIFIED" : "INCOMPLETE"}
                                    </Text>
                                </View>
                            </View>

                            {/* RIGHT: Details */}
                            <View style={styles.rightColumn}>
                                <Text style={styles.fullName} numberOfLines={1}>
                                    {profile.fullName || user.name || "Not Provided"}
                                </Text>

                                <View style={styles.detailRow}>
                                    <Text style={styles.label}>RIDER ID</Text>
                                    <Text style={styles.value}>{profile.riderId || "Generating..."}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.label}>LICENSE NO.</Text>
                                    <Text style={styles.value}>{profile.licenseNumber || "Not Provided"}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.label}>VEHICLE NO.</Text>
                                    <Text style={styles.value}>{profile.vehicleNumber || "Not Provided"}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.label}>VEHICLE</Text>
                                    <Text style={styles.value} numberOfLines={1}>
                                        {profile.vehicleName ? `${profile.vehicleName} ${profile.vehicleModel || ''}` : "Not Provided"}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.label}>AGE | DOB</Text>
                                    <Text style={styles.value}>
                                        {profile.age || "??"} | {profile.dob || "??"}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.label}>MEMBER SINCE</Text>
                                    <Text style={styles.value}>{formatDate(user.createdAt)}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.label}>ROLE</Text>
                                    <Text style={styles.value}>{profile.role || "Rider"}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Footer with QR */}
                        <View style={styles.cardFooter}>
                            <View style={styles.footerInfo}>
                                <Text style={styles.disclaimer}>Official Digital Identification</Text>
                                <Text style={styles.copyright}>© 2026 RidePulse Network</Text>
                            </View>

                            <View style={styles.qrContainer}>
                                <QRCode
                                    value={qrValue}
                                    size={50}
                                    color="white"
                                    backgroundColor="transparent"
                                />
                            </View>
                        </View>

                        {/* Gold Accent Border */}
                        <View style={styles.goldBorder} />
                    </LinearGradient>

                    {!isProfileComplete && (
                        <TouchableOpacity
                            style={styles.completeBtn}
                            activeOpacity={0.8}
                            onPress={() => {
                                onClose();
                                if (onCompleteProfile) onCompleteProfile();
                            }}
                        >
                            <LinearGradient
                                colors={['#FFD700', '#F59E0B']}
                                style={styles.completeGradient}
                            >
                                <Text style={styles.completeText}>COMPLETE YOUR PROFILE</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContainer: {
        width: width * 0.95,
        maxWidth: 400,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.1)',
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 10 },
    },
    goldBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 4,
        backgroundColor: '#FFD700',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
    closeBtn: {
        padding: 5,
    },
    mainContent: {
        flexDirection: 'row',
        gap: 20,
    },
    leftColumn: {
        width: 110,
        alignItems: 'center',
    },
    imageContainer: {
        width: 110,
        height: 130,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#374151',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1F2937',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    initialsText: {
        color: 'white',
        fontSize: 40,
        fontWeight: 'bold',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    verifiedBadge: {
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    incompleteBadge: {
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    badgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    rightColumn: {
        flex: 1,
    },
    fullName: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(55, 65, 81, 0.5)',
    },
    label: {
        color: '#6B7280',
        fontSize: 8,
        fontWeight: 'bold',
    },
    value: {
        color: '#D1D5DB',
        fontSize: 10,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 20,
    },
    footerInfo: {
        gap: 2,
    },
    disclaimer: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    copyright: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 7,
    },
    qrContainer: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
    },
    completeBtn: {
        marginTop: 20,
    },
    completeGradient: {
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    completeText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    }
>>>>>>> feb14-version
});

export default RiderIDCard;
