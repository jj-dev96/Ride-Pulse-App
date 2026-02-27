import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle, Path, Line, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

const StatsScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('History');

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
    import firestore from '@react-native-firebase/firestore';
            strokeWidth: 3
        }]
    };

    const heatmapData = {
        const [loading, setLoading] = useState(true);
        const [rides, setRides] = useState([]);
        const [userId, setUserId] = useState(null); // Set this from auth context or props
        labels: ["Start", "15m", "30m", "45m", "End"],
        useEffect(() => {
            // TODO: Replace with actual userId from auth context
            const uid = userId || 'CURRENT_USER_ID';
            const unsub = firestore()
                .collection('rides')
                .where('userId', '==', uid)
                .where('status', '==', 'completed')
                .onSnapshot(snapshot => {
                    setRides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    setLoading(false);
                });
            return () => unsub();
        }, [userId]);
        datasets: [{
        // Aggregation logic
        const stats = useMemo(() => {
            let totalDistance = 0, totalRides = 0, totalDuration = 0, maxSpeed = 0, longestRide = 0;
            rides.forEach(ride => {
                totalDistance += ride.distance || 0;
                totalDuration += ride.duration || 0;
                maxSpeed = Math.max(maxSpeed, ride.maxSpeed || 0);
                longestRide = Math.max(longestRide, ride.distance || 0);
            });
            totalRides = rides.length;
            const avgSpeed = totalDuration ? totalDistance / (totalDuration / 60) : 0; // km/h
            return {
                totalDistance,
                totalRides,
                avgSpeed,
                maxSpeed,
                longestRide,
                totalDuration
            };
        }, [rides]);
            data: [40, 60, 55, 90, 80, 110, 65],
            color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
            strokeWidth: 2
        }]
    };

    // --- RIDE DNA CHART ---
                        <Text style={styles.summaryValue}>{stats.totalDistance.toFixed(2)} <Text style={styles.summaryUnit}>km</Text></Text>
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 320 }}>
                <Svg height="300" width="300" viewBox="0 0 300 300">
                        <Text style={styles.summaryValue}>{stats.totalRides} <Text style={[styles.summaryUnit, { color: '#10B981' }]}>rides</Text></Text>
                        <Circle cx="150" cy="150" r="100" stroke="#333" strokeWidth="1" fill="none" />
                        <Circle cx="150" cy="150" r="75" stroke="#333" strokeWidth="1" fill="none" />
                        <Circle cx="150" cy="150" r="50" stroke="#333" strokeWidth="1" fill="none" />
                        {[...Array(24)].map((_, i) => {
                            const angle = (i * 15) * (Math.PI / 180);
                            const x2 = 150 + Math.cos(angle) * 100;
                            const y2 = 150 + Math.sin(angle) * 100;
                            const isActive = i > 18 || i < 6;
                            const color = isActive ? "#EF4444" : "#1F2937";
                            const rInner = isActive ? Math.random() * 40 + 20 : 0;
                            const xInner = 150 + Math.cos(angle) * rInner;
                            const yInner = 150 + Math.sin(angle) * rInner;
                            return isActive ? (
                                <Line key={i} x1="150" y1="150" x2={xInner} y2={yInner} stroke={color} strokeWidth="3" />
                            ) : null;
                        })}
                        <Path
                            d="M 150 150 Q 80 80 150 50 T 250 150"
                            stroke="#06B6D4"
                            strokeWidth="3"
                            fill="none"
                        />
                    </G>
                </Svg>
            </View>
        );
    };

    // --- TAB: HISTORY ---
    const renderHistory = () => (
        <View>
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

            <View style={styles.sectionHeader}>
                <MaterialIcons name="history" size={20} color="#FFD700" />
                <Text style={styles.sectionTitle}>Recent Highlights</Text>
            </View>

            <View style={styles.featuredCard}>
                <LinearGradient colors={['#1F2937', '#111827']} style={styles.featuredCardHeader}>
                    <Text style={styles.mapPlaceholderText}>Pacific Coast Highway Run</Text>
                    <Text style={styles.mapSubText}>Malibu to Ventura</Text>
                    {/* Real-time stats will be displayed here */}
                    <Text style={styles.dnaValue}>Flow: {stats.flow || 'N/A'}</Text>
                    <Text style={styles.dnaValue}>Intensity: {stats.intensity || 'N/A'}</Text>
                    <Text style={styles.dnaValue}>Harmony: {stats.harmony || 'N/A'}</Text>
                        </View>
                    </View>
                    <View style={styles.actionRow}>
                        <View style={styles.avatarStack}>
                            <View style={[styles.avatar, { backgroundColor: '#EF4444', zIndex: 3 }]}><Text style={styles.avatarText}>JD</Text></View>
                            <View style={[styles.avatar, { backgroundColor: '#3B82F6', zIndex: 2, marginLeft: -10 }]}><Text style={styles.avatarText}>MK</Text></View>
                            <View style={[styles.avatar, { backgroundColor: '#4B5563', zIndex: 1, marginLeft: -10 }]}><Text style={styles.avatarText}>+3</Text></View>
                        </View>
                        <TouchableOpacity style={styles.analyticsButton}>
                            <Text style={styles.analyticsButtonText}>View Details</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <Text style={[styles.sectionTitle, { marginLeft: 0 }]}>RIDE DNA</Text>
                <View style={styles.proBadge}><Text style={styles.proText}>PRO</Text></View>
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
                        <Text style={styles.gridLabel}>MAX LEAN</Text>
                        <MaterialIcons name="refresh" size={14} color="#06B6D4" style={{ marginLeft: 'auto' }} />
                    </View>
                    <View style={styles.valueRow}>
                        <Text style={styles.bigValue}>48°</Text>
                        <Text style={styles.subValue}>Left</Text>
                    </View>
                    <View style={styles.leanGauge}>
                        <View style={[styles.gaugeArc, { transform: [{ rotate: '-45deg' }] }]} />
                        <View style={styles.gaugeNeedle} />
                    </View>
                </View>

                <View style={[styles.card, styles.gridCard]}>
                    <View style={styles.cardHeaderSimple}>
                        <Text style={styles.gridLabel}>G-FORCE</Text>
                        <MaterialIcons name="speed" size={14} color="#EF4444" style={{ marginLeft: 'auto' }} />
                    </View>
                    <View style={styles.valueRow}>
                        <Text style={styles.bigValue}>1.2</Text>
                        <Text style={[styles.subValue, { fontSize: 16, marginTop: 8 }]}>G</Text>
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
    const renderAchievements = () => (
        <View>
            {/* Main Big Badge */}
            <View style={styles.mainBadgeContainer}>
                <LinearGradient colors={['#FFD70020', '#FFD70000']} style={styles.mainBadgeGlow} />
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/625/625394.png' }} style={styles.mainBadgeIcon} tintColor="#FFD700" />
                <Text style={styles.mainBadgeTitle}>IRON BUTT</Text>
                <Text style={styles.mainBadgeSub}>Ride 1000km in 24 hours</Text>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '80%', backgroundColor: '#FFD700' }]} />
                </View>
                <Text style={styles.mainBadgeProgress}>820 / 1000 km</Text>
            </View>

            <Text style={styles.gridTitle}>RECENTLY UNLOCKED</Text>
            <View style={styles.badgesGrid}>
                {[
                    { name: 'Night Rider', icon: 'brightness-3', color: '#8B5CF6', locked: false },
                    { name: 'Canyon Carver', icon: 'terrain', color: '#10B981', locked: false },
                    { name: 'Speed Demon', icon: 'flash-on', color: '#EF4444', locked: false },
                ].map((badge, index) => (
                    <View key={index} style={styles.badgeCard}>
                        <View style={[styles.badgeIconBg, { backgroundColor: badge.color + '20' }]}>
                            <MaterialIcons name={badge.icon} size={24} color={badge.color} />
                        </View>
                        <Text style={styles.badgeName}>{badge.name}</Text>
                    </View>
                ))}
            </View>

            <Text style={styles.gridTitle}>LOCKED</Text>
            <View style={styles.badgesGrid}>
                {[
                    { name: 'Global Tourist', icon: 'public', color: '#6B7280', locked: true },
                    { name: 'Squad Leader', icon: 'groups', color: '#6B7280', locked: true },
                    { name: 'Ghost Rider', icon: 'no-sim', color: '#6B7280', locked: true },
                ].map((badge, index) => (
                    <View key={index} style={[styles.badgeCard, { opacity: 0.5 }]}>
                        <View style={[styles.badgeIconBg, { backgroundColor: '#1F2937' }]}>
                            <MaterialIcons name="lock" size={20} color="#6B7280" />
                        </View>
                        <Text style={[styles.badgeName, { color: '#6B7280' }]}>{badge.name}</Text>
                    </View>
                ))}
            </View>
        </View>
    );

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
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <FontAwesome5 name="motorcycle" size={20} color="black" />
                        </View>
                        <Text style={styles.logoText}>RIDEPULSE</Text>
                    </View>
                </View>

                {/* SCROLLABLE TAB SWITCHER */}
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

                {/* Content Render */}
                {activeTab === 'History' && renderHistory()}
                {activeTab === 'Telemetry' && renderTelemetry()}
                {activeTab === 'Achievements' && renderAchievements()}
                {activeTab === 'Routes' && renderRoutes()}

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
    goBtn: { width: 50, backgroundColor: '#06B6D4', alignItems: 'center', justifyContent: 'center' }
});

export default StatsScreen;
