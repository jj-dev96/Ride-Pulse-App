import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle, Path, Line, G, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

const StatsScreen = ({ navigation }) => {
    // Custom Ride DNA Chart Component
    const RideDNAChart = () => {
        const center = 150;
        const radius = 100;

        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 320 }}>
                <Svg height="300" width="300" viewBox="0 0 300 300">
                    <G rotation="-90" origin="150, 150">
                        {/* Background Circles */}
                        <Circle cx="150" cy="150" r="100" stroke="#333" strokeWidth="1" fill="none" />
                        <Circle cx="150" cy="150" r="75" stroke="#333" strokeWidth="1" fill="none" />
                        <Circle cx="150" cy="150" r="50" stroke="#333" strokeWidth="1" fill="none" />

                        {/* Safe/Aggressive lines (Mock visualization) */}
                        {[...Array(24)].map((_, i) => {
                            const angle = (i * 15) * (Math.PI / 180);
                            const x2 = 150 + Math.cos(angle) * 100;
                            const y2 = 150 + Math.sin(angle) * 100;

                            // Red burst (Aggressive sectors)
                            const isActive = i > 18 || i < 6;
                            const color = isActive ? "#EF4444" : "#1F2937";
                            const strokeWidth = isActive ? 2 : 1;

                            // Inner burst
                            const rInner = isActive ? Math.random() * 40 + 20 : 0;
                            const xInner = 150 + Math.cos(angle) * rInner;
                            const yInner = 150 + Math.sin(angle) * rInner;

                            return isActive ? (
                                <Line key={i} x1="150" y1="150" x2={xInner} y2={yInner} stroke={color} strokeWidth="3" />
                            ) : null;
                        })}

                        {/* Spiral Line (Flow) */}
                        <Path
                            d="M 150 150 Q 80 80 150 50 T 250 150"
                            stroke="#06B6D4" // Cyan/Teal
                            strokeWidth="3"
                            fill="none"
                        />
                    </G>
                </Svg>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
            <SafeAreaView edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <FontAwesome5 name="motorcycle" size={20} color="black" />
                        </View>
                        <Text style={styles.logoText}>RIDEPULSE</Text>
                    </View>
                    <TouchableOpacity>
                        <MaterialIcons name="notifications" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>TOTAL DISTANCE</Text>
                        <Text style={styles.summaryValue}>1,248 <Text style={styles.summaryUnit}>km</Text></Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>TOTAL RIDES</Text>
                        <Text style={styles.summaryValue}>42 <Text style={[styles.summaryUnit, { color: '#10B981' }]}>rides</Text></Text>
                    </View>
                </View>

                {/* Ride History Section */}
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="history" size={20} color="#FFD700" />
                    <Text style={styles.sectionTitle}>Ride History</Text>
                </View>

                {/* Featured Ride Card */}
                <View style={styles.featuredCard}>
                    {/* Map Placeholder Image Background would go here, using a gradient for now */}
                    <LinearGradient
                        colors={['#1F2937', '#111827']}
                        style={styles.featuredCardHeader}
                    >
                        <Text style={styles.mapPlaceholderText}>Pacific Coast Highway Run</Text>
                        <Text style={styles.mapSubText}>Malibu to Ventura</Text>
                        <View style={styles.datePill}>
                            <Text style={styles.dateText}>Oct 24, 2023</Text>
                        </View>
                    </LinearGradient>

                    <View style={styles.featuredCardBody}>
                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>DISTANCE</Text>
                                <Text style={styles.statValue}>85 km</Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>DURATION</Text>
                                <Text style={styles.statValue}>1h 12m</Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>AVG SPEED</Text>
                                <Text style={styles.statValue}>68 km/h</Text>
                            </View>
                        </View>

                        {/* Avatars & Action */}
                        <View style={styles.actionRow}>
                            <View style={styles.avatarStack}>
                                <View style={[styles.avatar, { backgroundColor: '#EF4444', zIndex: 3 }]}>
                                    <Text style={styles.avatarText}>JD</Text>
                                </View>
                                <View style={[styles.avatar, { backgroundColor: '#3B82F6', zIndex: 2, marginLeft: -10 }]}>
                                    <Text style={styles.avatarText}>MK</Text>
                                </View>
                                <View style={[styles.avatar, { backgroundColor: '#4B5563', zIndex: 1, marginLeft: -10 }]}>
                                    <Text style={styles.avatarText}>+3</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.analyticsButton}>
                                <Text style={styles.analyticsButtonText}>View Analytics</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Progress Bars */}
                        <View style={styles.barsContainer}>
                            <View style={styles.barRow}>
                                <View style={styles.barLabelContainer}>
                                    <Text style={styles.barLabel}>MAX LEAN</Text>
                                    <FontAwesome5 name="motorcycle" size={12} color="#FFD700" />
                                </View>
                                <View style={styles.infoBarTrack}>
                                    <View style={[styles.infoBarFill, { width: '42%' }]} />
                                    <Text style={styles.barValue}>42°</Text>
                                </View>
                            </View>

                            <View style={styles.barRow}>
                                <View style={styles.barLabelContainer}>
                                    <Text style={styles.barLabel}>TOP SPEED</Text>
                                    <Ionicons name="speedometer" size={12} color="#EF4444" />
                                </View>
                                <View style={[styles.infoBarTrack, { borderColor: '#EF444455' }]}>
                                    <View style={[styles.infoBarFill, { width: '85%', backgroundColor: '#EF4444' }]} />
                                    <Text style={styles.barValue}>142 km/h</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Recent Ride List Items */}
                <View style={styles.listCard}>
                    <View style={styles.listCardContent}>
                        <View style={styles.listMapPlaceholder}>
                            <Text style={{ color: 'white', fontSize: 10, textAlign: 'center' }}>Night Loop</Text>
                        </View>
                        <View style={styles.listDetails}>
                            <Text style={styles.listTitle}>Downtown Night Loop</Text>
                            <View style={styles.listSubRow}>
                                <MaterialIcons name="place" size={12} color="#6B7280" />
                                <Text style={styles.listSubText}>24 km</Text>
                                <MaterialIcons name="schedule" size={12} color="#6B7280" style={{ marginLeft: 8 }} />
                                <Text style={styles.listSubText}>45m</Text>
                            </View>
                        </View>
                        <View style={styles.listRight}>
                            <View style={styles.listDatePill}>
                                <Text style={styles.listDateText}>Oct 20</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#4B5563" />
                        </View>
                    </View>
                </View>

                <View style={styles.listCard}>
                    <View style={styles.listCardContent}>
                        <View style={[styles.listMapPlaceholder, { backgroundColor: '#7f1d1d' }]}>
                            <Text style={{ color: '#fecaca', fontSize: 10, textAlign: 'center' }}>Canyon</Text>
                        </View>
                        <View style={styles.listDetails}>
                            <Text style={styles.listTitle}>Red Rock Canyon</Text>
                            <View style={styles.listSubRow}>
                                <MaterialIcons name="place" size={12} color="#6B7280" />
                                <Text style={styles.listSubText}>112 km</Text>
                                <MaterialIcons name="schedule" size={12} color="#6B7280" style={{ marginLeft: 8 }} />
                                <Text style={styles.listSubText}>2h 05m</Text>
                            </View>
                            <View style={styles.soloTag}>
                                <Text style={styles.soloTagText}>Solo Ride</Text>
                            </View>
                        </View>
                        <View style={styles.listRight}>
                            <View style={styles.listDatePill}>
                                <Text style={styles.listDateText}>Oct 15</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#4B5563" />
                        </View>
                    </View>
                </View>

                {/* Ride DNA Section */}
                <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                    <Text style={[styles.sectionTitle, { marginLeft: 0 }]}>RIDE DNA</Text>
                    <View style={styles.proBadge}>
                        <Text style={styles.proText}>PRO</Text>
                    </View>
                    <TouchableOpacity style={{ marginLeft: 'auto' }}>
                        <Text style={styles.regenerateText}>REGENERATE</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.dnaCard}>
                    <RideDNAChart />

                    <View style={styles.dnaStatsRow}>
                        <View style={styles.dnaStat}>
                            <Text style={styles.dnaLabel}>FLOW</Text>
                            <Text style={styles.dnaValue}>92%</Text>
                        </View>
                        <View style={styles.dnaStat}>
                            <Text style={styles.dnaLabel}>INTENSITY</Text>
                            <Text style={[styles.dnaValue, { color: '#EF4444' }]}>88%</Text>
                        </View>
                        <View style={styles.dnaStat}>
                            <Text style={styles.dnaLabel}>HARMONY</Text>
                            <Text style={[styles.dnaValue, { color: '#F59E0B' }]}>95%</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.shareBtn}>
                        <MaterialIcons name="share" size={16} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.shareBtnText}>SHARE FINGERPRINT</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        width: 32,
        height: 32,
        backgroundColor: '#FFD700',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    logoText: {
        color: '#FFD700',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    summaryContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#161925',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    summaryLabel: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    summaryValue: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    summaryUnit: {
        fontSize: 14,
        color: '#FFD700',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    featuredCard: {
        backgroundColor: '#161925',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1F2937',
        marginBottom: 15,
    },
    featuredCardHeader: {
        height: 120,
        padding: 15,
        justifyContent: 'flex-end',
    },
    mapPlaceholderText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    mapSubText: {
        color: '#FFD700',
        fontSize: 12,
        marginTop: 2,
    },
    datePill: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: '#00000080',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    dateText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    featuredCardBody: {
        padding: 15,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
        paddingBottom: 20,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    verticalDivider: {
        width: 1,
        backgroundColor: '#1F2937',
    },
    statLabel: {
        color: '#6B7280',
        fontSize: 10,
        marginBottom: 4,
    },
    statValue: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarStack: {
        flexDirection: 'row',
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#161925',
    },
    avatarText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    analyticsButton: {
        borderColor: '#FFD700',
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    analyticsButtonText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    },
    barsContainer: {
        gap: 15,
    },
    barRow: {
        width: '100%',
    },
    barLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    barLabel: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: 'bold',
    },
    infoBarTrack: {
        height: 6,
        backgroundColor: '#1F2937',
        borderRadius: 3,
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoBarFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 3,
    },
    barValue: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        position: 'absolute',
        right: 0,
        top: -18,
    },
    listCard: {
        backgroundColor: '#161925',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#1F2937',
        marginBottom: 10,
    },
    listCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listMapPlaceholder: {
        width: 60,
        height: 60,
        backgroundColor: '#111827',
        borderRadius: 8,
        marginRight: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listDetails: {
        flex: 1,
    },
    listTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    listSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listSubText: {
        color: '#6B7280',
        fontSize: 12,
        marginLeft: 4,
    },
    listRight: {
        alignItems: 'flex-end',
        gap: 10,
    },
    listDatePill: {
        backgroundColor: '#1F2937',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    listDateText: {
        color: '#9CA3AF',
        fontSize: 10,
    },
    soloTag: {
        backgroundColor: '#F59E0B20',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#F59E0B50'
    },
    soloTagText: {
        color: '#F59E0B',
        fontSize: 10,
        fontWeight: 'bold',
    },
    proBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 10,
    },
    proText: {
        color: 'black',
        fontSize: 10,
        fontWeight: 'bold',
    },
    regenerateText: {
        color: '#FFD700',
        fontSize: 10,
        fontWeight: 'bold',
    },
    dnaCard: {
        backgroundColor: '#161925',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    dnaStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    dnaStat: {
        alignItems: 'center',
    },
    dnaLabel: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    dnaValue: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1F2937',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#374151',
    },
    shareBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});

export default StatsScreen;
