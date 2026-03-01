import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { AuthContext } from '../context/AuthContext';
import { RideService } from '../services/RideService';

const { width } = Dimensions.get('window');

const StatsScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('History');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [achievements, setAchievements] = useState({});

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    const fetchData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const [userStats, rideHistory, userAch] = await Promise.all([
                RideService.getUserStats(user.id),
                RideService.getRideHistory(user.id),
                RideService.getAchievements(user.id)
            ]);
            setStats(userStats);
            setHistory(rideHistory);
            setAchievements(userAch || {});
        } catch (error) {
            console.error("Error fetching stats data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // --- CHART CONFIG & DATA ---
    const chartConfig = {
        backgroundGradientFrom: "#161925",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#161925",
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
        strokeWidth: 2,
        propsForDots: { r: "0" },
        propsForBackgroundLines: { strokeDasharray: "" }
    };

    const lineData = {
        labels: ["", "", "", "", "", ""],
        datasets: [{
            data: [20, 45, 28, 80, 50, 60, 40],
            color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
            strokeWidth: 3
        }]
    };

    const heatmapData = {
        labels: ["Start", "15m", "30m", "45m", "End"],
        datasets: [{
            data: [40, 60, 55, 90, 80, 110, 65],
            color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
            strokeWidth: 2
        }]
    };

    // --- TAB: HISTORY ---
    const renderHistory = () => (
        <View>
            <View style={styles.summaryContainer}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>TOTAL DISTANCE</Text>
                    <Text style={styles.summaryValue}>{stats?.totalDistance?.toFixed(1) || '0'} <Text style={styles.summaryUnit}>km</Text></Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>TOTAL RIDES</Text>
                    <Text style={styles.summaryValue}>{stats?.totalRides || '0'} <Text style={[styles.summaryUnit, { color: '#10B981' }]}>rides</Text></Text>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <MaterialIcons name="history" size={20} color="#FFD700" />
                <Text style={styles.sectionTitle}>Recent Rides</Text>
            </View>

            {history.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No rides recorded yet.</Text>
                </View>
            ) : (
                history.map((ride, index) => (
                    <View key={ride.id} style={styles.featuredCard}>
                        <LinearGradient colors={['#1F2937', '#111827']} style={styles.featuredCardHeader}>
                            <Text style={styles.mapPlaceholderText}>{ride.name || `Ride #${history.length - index}`}</Text>
                            <Text style={styles.mapSubText}>{ride.startName || 'Unknown Start'} → {ride.endName || 'Unknown Destination'}</Text>
                            <View style={styles.datePill}>
                                <Text style={styles.dateText}>
                                    {ride.timestamp?.toDate ? ride.timestamp.toDate().toLocaleDateString() : 'Recent'}
                                </Text>
                            </View>
                        </LinearGradient>
                        <View style={styles.featuredCardBody}>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>DISTANCE</Text>
                                    <Text style={styles.statValue}>{ride.distance?.toFixed(1)} km</Text>
                                </View>
                                <View style={styles.verticalDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>DURATION</Text>
                                    <Text style={styles.statValue}>{Math.floor(ride.duration / 60)}m {ride.duration % 60}s</Text>
                                </View>
                                <View style={styles.verticalDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>AVG SPEED</Text>
                                    <Text style={styles.statValue}>{ride.averageSpeed?.toFixed(1)} km/h</Text>
                                </View>
                            </View>
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={styles.returnButton}
                                    onPress={() => navigation.navigate('Map', {
                                        returnTrip: true,
                                        startCoords: ride.endLocation,
                                        destCoords: ride.startLocation,
                                        startName: ride.endName,
                                        destName: ride.startName
                                    })}
                                >
                                    <MaterialIcons name="replay" size={16} color="black" />
                                    <Text style={styles.returnButtonText}>Return Trip</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.analyticsButton}>
                                    <Text style={styles.analyticsButtonText}>Details</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    // --- TAB: TELEMETRY ---
    const renderTelemetry = () => (
        <View>
            <View style={[styles.card, { padding: 0 }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.liveIndicatorRow}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.cardTitle}>Live Session Replay</Text>
                    </View>
                    <View style={styles.liveBadge}>
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                </View>
                <View style={{ height: 120, marginLeft: -20, marginTop: 10 }}>
                    <LineChart
                        data={lineData}
                        width={width - 20}
                        height={120}
                        chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})` }}
                        bezier
                        withHorizontalLines={false}
                        withVerticalLines={false}
                        withHorizontalLabels={false}
                        withDots={false}
                    />
                    <View style={{ position: 'absolute', left: '42%', top: 35, width: 12, height: 12, borderRadius: 6, backgroundColor: 'white', shadowColor: '#FFD700', shadowOpacity: 1, shadowRadius: 10 }} />
                </View>
                <View style={styles.timeRow}>
                    <Text style={styles.timeText}>09:12:00</Text>
                    <Text style={[styles.timeText, { color: '#FFD700' }]}>09:45:30</Text>
                </View>
                <View style={styles.controlsRow}>
                    <TouchableOpacity><MaterialIcons name="replay-10" size={20} color="#6B7280" /></TouchableOpacity>
                    <TouchableOpacity style={styles.playPauseBtn}>
                        <MaterialIcons name="pause" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity><MaterialIcons name="forward-10" size={20} color="#6B7280" /></TouchableOpacity>
                </View>
            </View>

            <View style={styles.gridRow}>
                <View style={[styles.card, styles.gridCard]}>
                    <View style={styles.cardHeaderSimple}>
                        <Text style={styles.gridLabel}>MAX SPEED</Text>
                        <MaterialIcons name="speed" size={14} color="#EF4444" style={{ marginLeft: 'auto' }} />
                    </View>
                    <View style={styles.valueRow}>
                        <Text style={styles.bigValue}>{stats?.maxSpeed?.toFixed(1) || '0'}</Text>
                        <Text style={styles.subValue}>km/h</Text>
                    </View>
                    <View style={styles.leanGauge}>
                        <View style={[styles.gaugeArc, { borderTopColor: '#EF4444', borderLeftColor: '#EF4444' }]} />
                        <View style={styles.gaugeNeedle} />
                    </View>
                </View>

                <View style={[styles.card, styles.gridCard]}>
                    <View style={styles.cardHeaderSimple}>
                        <Text style={styles.gridLabel}>LONGEST RIDE</Text>
                        <MaterialIcons name="terrain" size={14} color="#06B6D4" style={{ marginLeft: 'auto' }} />
                    </View>
                    <View style={styles.valueRow}>
                        <Text style={styles.bigValue}>{stats?.longestRide?.toFixed(1) || '0'}</Text>
                        <Text style={styles.subValue}>km</Text>
                    </View>
                    <View style={styles.gForceGrid}>
                        <View style={styles.gridLineH} />
                        <View style={styles.gridLineV} />
                        <View style={styles.gForceDot} />
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Speed Heatmap</Text>
                    <TouchableOpacity style={styles.filterBtn}>
                        <Text style={styles.filterBtnText}>Last Ride</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ marginTop: 10 }}>
                    <LineChart
                        data={heatmapData}
                        width={width - 50}
                        height={140}
                        chartConfig={{
                            ...chartConfig,
                            fillShadowGradientFrom: "#FFD700",
                            fillShadowGradientFromOpacity: 0.5,
                            fillShadowGradientTo: "#FFD700",
                            fillShadowGradientToOpacity: 0.1,
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                        }}
                        bezier
                        style={{ borderRadius: 8 }}
                        withInnerLines={true}
                        withOuterLines={false}
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.exportButton}>
                <MaterialIcons name="file-download" size={20} color="black" />
                <Text style={styles.exportButtonText}>EXPORT TELEMETRY DATA</Text>
            </TouchableOpacity>
        </View>
    );

    // --- TAB: ACHIEVEMENTS ---
    const renderAchievements = () => {
        const achList = [
            { id: 'first_ride', name: 'First Ride', icon: 'motorcycle', color: '#60A5FA', desc: 'Completed 1 ride' },
            { id: '50km_club', name: '50 KM Club', icon: 'terrain', color: '#10B981', desc: 'Ride 50km total' },
            { id: '100km_rider', name: '100 KM Rider', icon: 'flag', color: '#F59E0B', desc: 'Ride 100km total' },
            { id: '10_rides', name: 'Veteran', icon: 'stars', color: '#8B5CF6', desc: '10 rides completed' },
            { id: 'night_rider', name: 'Night Rider', icon: 'brightness-3', color: '#4B5563', desc: 'Ride after 10PM' },
            { id: 'early_bird', name: 'Early Bird', icon: 'wb-sunny', color: '#FED7AA', desc: 'Ride before 6AM' },
            { id: 'speed_master', name: 'Speed Master', icon: 'flash-on', color: '#EF4444', desc: 'Avg speed > 80km/h' },
            { id: 'marathon_rider', name: 'Marathon', icon: 'timer', color: '#EC4899', desc: 'Single ride > 200km' },
        ];

        return (
            <View>
                <Text style={styles.gridTitle}>UNLOCKED ACHIEVEMENTS</Text>
                <View style={styles.badgesGrid}>
                    {achList.map((ach) => {
                        const isUnlocked = !!achievements[ach.id];
                        return (
                            <View key={ach.id} style={[styles.badgeCard, !isUnlocked && { opacity: 0.3 }]}>
                                <View style={[styles.badgeIconBg, { backgroundColor: isUnlocked ? ach.color + '20' : '#1F2937' }]}>
                                    <MaterialIcons name={isUnlocked ? ach.icon : 'lock'} size={24} color={isUnlocked ? ach.color : '#6B7280'} />
                                </View>
                                <Text style={[styles.badgeName, !isUnlocked && { color: '#6B7280' }]}>{ach.name}</Text>
                                {isUnlocked && (
                                    <Text style={styles.unlockDate}>
                                        {new Date(achievements[ach.id].unlockedAt).toLocaleDateString()}
                                    </Text>
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    // --- TAB: ROUTES ---
    const renderRoutes = () => (
        <View>
            <TouchableOpacity style={styles.addRouteBtn}>
                <MaterialIcons name="add" size={24} color="black" />
                <Text style={styles.addRouteText}>PLAN NEW ROUTE</Text>
            </TouchableOpacity>

            <Text style={styles.gridTitle}>FAVORITES</Text>

            {[
                { name: 'Mulholland Drive', dist: '32 km', curves: 5, elev: '420m', img: '#1F2937' },
                { name: 'Angeles Crest', dist: '105 km', curves: 4, elev: '2200m', img: '#111827' },
            ].map((route, i) => (
                <View key={i} style={styles.routeCard}>
                    <View style={[styles.routeImg, { backgroundColor: route.img }]}>
                        <MaterialIcons name="map" size={40} color="#374151" />
                    </View>
                    <View style={styles.routeContent}>
                        <Text style={styles.routeTitle}>{route.name}</Text>
                        <View style={styles.routeStats}>
                            <View style={styles.routeStatParam}>
                                <MaterialIcons name="straighten" size={14} color="#9CA3AF" />
                                <Text style={styles.routeStatVal}>{route.dist}</Text>
                            </View>
                            <View style={styles.routeStatParam}>
                                <MaterialIcons name="terrain" size={14} color="#9CA3AF" />
                                <Text style={styles.routeStatVal}>{route.elev}</Text>
                            </View>
                        </View>
                        {/* Curve Rating */}
                        <View style={styles.curveRating}>
                            {[...Array(5)].map((_, starI) => (
                                <MaterialIcons
                                    key={starI}
                                    name="star"
                                    size={12}
                                    color={starI < route.curves ? '#FFD700' : '#374151'}
                                />
                            ))}
                            <Text style={styles.curveLabel}>Curve Rating</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.goBtn}>
                        <MaterialIcons name="navigation" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
            }
        >
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <FontAwesome5 name="motorcycle" size={20} color="black" />
                        </View>
                        <Text style={styles.logoText}>RIDEPULSE</Text>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
                    {['History', 'Telemetry', 'Achievements', 'Routes'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {loading && !refreshing ? (
                    <View style={{ height: 400, justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color="#FFD700" />
                    </View>
                ) : (
                    <>
                        {activeTab === 'History' && renderHistory()}
                        {activeTab === 'Telemetry' && renderTelemetry()}
                        {activeTab === 'Achievements' && renderAchievements()}
                        {activeTab === 'Routes' && renderRoutes()}
                    </>
                )}
            </SafeAreaView>
        </ScrollView>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F111A', paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
    logoContainer: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { width: 32, height: 32, backgroundColor: '#FFD700', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    logoText: { color: '#FFD700', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },

    // Scrollable Tabs
    tabScroll: { marginBottom: 20, maxHeight: 60 },
    tabContainer: { flexDirection: 'row', gap: 10, paddingRight: 20 },
    tabButton: { paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', borderRadius: 20, backgroundColor: '#161925', borderWidth: 1, borderColor: '#1F2937' },
    activeTabButton: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
    tabText: { color: '#6B7280', fontWeight: 'bold', fontSize: 13 },
    activeTabText: { color: 'black' },

    // --- History Styles ---
    summaryContainer: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    summaryCard: { flex: 1, backgroundColor: '#161925', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#1F2937' },
    summaryLabel: { color: '#6B7280', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
    summaryValue: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    summaryUnit: { fontSize: 14, color: '#FFD700' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    featuredCard: { backgroundColor: '#161925', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1F2937', marginBottom: 15 },
    featuredCardHeader: { height: 120, padding: 15, justifyContent: 'flex-end' },
    mapPlaceholderText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    mapSubText: { color: '#FFD700', fontSize: 12, marginTop: 2 },
    datePill: { position: 'absolute', top: 15, right: 15, backgroundColor: '#00000080', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    dateText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    featuredCardBody: { padding: 15 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1F2937', paddingBottom: 20 },
    statItem: { alignItems: 'center', flex: 1 },
    verticalDivider: { width: 1, backgroundColor: '#1F2937' },
    statLabel: { color: '#6B7280', fontSize: 10, marginBottom: 4 },
    statValue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    avatarStack: { flexDirection: 'row' },
    avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#161925' },
    avatarText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    analyticsButton: { borderColor: '#FFD700', borderWidth: 1, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    analyticsButtonText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
    proBadge: { backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 10 },
    proText: { color: 'black', fontSize: 10, fontWeight: 'bold' },
    dnaCard: { backgroundColor: '#161925', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1F2937' },
    dnaStatsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    dnaStat: { alignItems: 'center' },
    dnaLabel: { color: '#6B7280', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
    dnaValue: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F2937', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#374151' },
    shareBtnText: { color: 'white', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

    // --- Telemetry Styles ---
    card: { backgroundColor: '#161925', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#1F2937', overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 15, marginTop: 15 },
    cardHeaderSimple: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
    cardTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    liveIndicatorRow: { flexDirection: 'row', alignItems: 'center' },
    recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 8 },
    liveBadge: { borderColor: '#EF4444', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#EF444410' },
    liveBadgeText: { color: '#EF4444', fontSize: 10, fontWeight: 'bold' },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginBottom: 20 },
    timeText: { color: '#6B7280', fontSize: 10, fontFamily: 'monospace' },
    controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 25, paddingVertical: 15 },
    playPauseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' },
    gridRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    gridCard: { flex: 1, marginBottom: 0, height: 160 },
    gridLabel: { color: '#6B7280', fontSize: 10, fontWeight: 'bold' },
    valueRow: { flexDirection: 'row', alignItems: 'baseline' },
    bigValue: { color: 'white', fontSize: 32, fontWeight: 'bold', marginRight: 4 },
    subValue: { color: '#9CA3AF', fontSize: 12 },
    leanGauge: { marginTop: 20, height: 60, alignItems: 'center', justifyContent: 'flex-end' },
    gaugeArc: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#1F2937', borderTopColor: '#06B6D4', borderLeftColor: '#06B6D4', position: 'absolute', bottom: -30 },
    gaugeNeedle: { width: 2, height: 35, backgroundColor: 'white', transform: [{ rotate: '-20deg' }], position: 'absolute', bottom: 0 },
    gForceGrid: { marginTop: 20, height: 50, backgroundColor: '#111827', borderRadius: 4, borderWidth: 1, borderColor: '#374151', position: 'relative' },
    gridLineH: { position: 'absolute', top: '50%', width: '100%', height: 1, backgroundColor: '#374151' },
    gridLineV: { position: 'absolute', left: '50%', height: '100%', width: 1, backgroundColor: '#374151' },
    gForceDot: { position: 'absolute', top: '30%', right: '20%', width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
    filterBtn: { backgroundColor: '#1F2937', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#374151' },
    filterBtnText: { color: '#FFD700', fontSize: 10 },
    exportButton: { flexDirection: 'row', backgroundColor: '#FFD700', paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 20 },
    exportButtonText: { color: 'black', fontWeight: 'bold', fontSize: 14, marginLeft: 10, letterSpacing: 1 },

    // --- Achievements Styles ---
    mainBadgeContainer: { alignItems: 'center', padding: 20, backgroundColor: '#161925', borderRadius: 20, borderWidth: 1, borderColor: '#FFD700', marginBottom: 25 },
    mainBadgeGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
    mainBadgeIcon: { width: 80, height: 80, marginBottom: 15 },
    mainBadgeTitle: { color: '#FFD700', fontSize: 18, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
    mainBadgeSub: { color: '#9CA3AF', fontSize: 12, marginBottom: 15 },
    progressBarBg: { width: '100%', height: 6, backgroundColor: '#111827', borderRadius: 3, marginBottom: 5 },
    progressBarFill: { height: '100%', borderRadius: 3 },
    mainBadgeProgress: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
    gridTitle: { color: '#6B7280', fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
    badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 25 },
    badgeCard: { width: '30%', backgroundColor: '#161925', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
    badgeIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    badgeName: { color: 'white', fontSize: 10, textAlign: 'center', fontWeight: 'bold' },

    // --- Routes Styles ---
    addRouteBtn: { flexDirection: 'row', backgroundColor: '#FFD700', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    addRouteText: { color: 'black', fontWeight: 'bold', fontSize: 14, marginLeft: 10 },
    routeCard: { flexDirection: 'row', backgroundColor: '#161925', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1F2937', marginBottom: 15, height: 100 },
    routeImg: { width: 100, alignItems: 'center', justifyContent: 'center' },
    routeContent: { flex: 1, padding: 12, justifyContent: 'center' },
    routeTitle: { color: 'white', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
    routeStats: { flexDirection: 'row', gap: 15, marginBottom: 8 },
    routeStatParam: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    routeStatVal: { color: '#9CA3AF', fontSize: 10 },
    curveRating: { flexDirection: 'row', items: 'center', gap: 2 },
    curveLabel: { color: '#6B7280', fontSize: 8, marginLeft: 4 },
    goBtn: { width: 50, backgroundColor: '#06B6D4', alignItems: 'center', justifyContent: 'center' },
    emptyState: { height: 200, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: '#6B7280', fontSize: 14 },
    returnButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD700', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
    returnButtonText: { color: 'black', fontSize: 12, fontWeight: 'bold' },
    unlockDate: { color: '#10B981', fontSize: 8, marginTop: 4 }
});

export default StatsScreen;
