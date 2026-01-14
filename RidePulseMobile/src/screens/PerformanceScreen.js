import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Svg, Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const PerformanceScreen = ({ navigation }) => {

    // Waveform data for Session Replay
    const lineData = {
        labels: ["", "", "", "", "", ""],
        datasets: [
            {
                data: [20, 45, 28, 80, 50, 60, 40],
                color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`, // Gold
                strokeWidth: 3
            }
        ]
    };

    const chartConfig = {
        backgroundGradientFrom: "#161925",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#161925",
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
        strokeWidth: 2,
        propsForDots: { r: "0" },
        propsForBackgroundLines: { strokeDasharray: "" } // solid lines
    };

    // Heatmap Area Data
    const heatmapData = {
        labels: ["Start", "15m", "30m", "45m", "End"],
        datasets: [
            {
                data: [40, 60, 55, 90, 80, 110, 65],
                color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
                strokeWidth: 2
            }
        ]
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
            <SafeAreaView edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <FontAwesome5 name="shield-alt" size={18} color="black" />
                        </View>
                        <View>
                            <Text style={styles.logoText}>RIDEPULSE</Text>
                            <Text style={styles.logoSubText}>TELEMETRY ANALYTICS</Text>
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.zoneButton}>
                            <MaterialIcons name="flash-on" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                            <Text style={styles.zoneButtonText}>ZONE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <MaterialIcons name="notifications" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Live Session Replay Card */}
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

                    {/* Waveform Chart */}
                    <View style={{ height: 120, marginLeft: -20, marginTop: 10 }}>
                        <LineChart
                            data={lineData}
                            width={width - 20}
                            height={120}
                            chartConfig={{
                                ...chartConfig,
                                color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
                            }}
                            bezier
                            withHorizontalLines={false}
                            withVerticalLines={false}
                            withHorizontalLabels={false}
                            withDots={false}
                        />
                        {/* Playhead marker simulation */}
                        <View style={{ position: 'absolute', left: '42%', top: 35, width: 12, height: 12, borderRadius: 6, backgroundColor: 'white', shadowColor: '#FFD700', shadowOpacity: 1, shadowRadius: 10 }} />
                    </View>

                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>09:12:00</Text>
                        <Text style={[styles.timeText, { color: '#FFD700' }]}>09:45:30</Text>
                    </View>

                    {/* Custom Slider / Scrubber */}
                    <View style={styles.scrubberContainer}>
                        {/* Ticks */}
                        <View style={styles.ticksRow}>
                            {[...Array(10)].map((_, i) => (
                                <View key={i} style={[styles.tick, i === 7 && { backgroundColor: '#FFD700', height: 10 }]} />
                            ))}
                        </View>
                        {/* Playhead thumb */}
                        <View style={[styles.scrubberThumb, { left: '70%' }]} />
                    </View>

                    {/* Controls */}
                    <View style={styles.controlsRow}>
                        <TouchableOpacity><MaterialIcons name="replay-10" size={20} color="#6B7280" /></TouchableOpacity>
                        <TouchableOpacity style={styles.playPauseBtn}>
                            <MaterialIcons name="pause" size={24} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity><MaterialIcons name="forward-10" size={20} color="#6B7280" /></TouchableOpacity>
                    </View>
                </View>

                {/* Grid: Max Lean & G-Force */}
                <View style={styles.gridRow}>
                    {/* Max Lean */}
                    <View style={[styles.card, styles.gridCard]}>
                        <View style={styles.cardHeaderSimple}>
                            <Text style={styles.gridLabel}>MAX LEAN</Text>
                            <MaterialIcons name="info-outline" size={14} color="#6B7280" />
                            <MaterialIcons name="refresh" size={14} color="#06B6D4" style={{ marginLeft: 'auto' }} />
                        </View>
                        <View style={styles.valueRow}>
                            <Text style={styles.bigValue}>48°</Text>
                            <Text style={styles.subValue}>Left</Text>
                        </View>
                        {/* Lean Radial Gauge Mockup */}
                        <View style={styles.leanGauge}>
                            <View style={[styles.gaugeArc, { transform: [{ rotate: '-45deg' }] }]} />
                            <View style={styles.gaugeNeedle} />
                        </View>
                    </View>

                    {/* G-Force */}
                    <View style={[styles.card, styles.gridCard]}>
                        <View style={styles.cardHeaderSimple}>
                            <Text style={styles.gridLabel}>G-FORCE</Text>
                            <MaterialIcons name="info-outline" size={14} color="#6B7280" />
                            <MaterialIcons name="speed" size={14} color="#EF4444" style={{ marginLeft: 'auto' }} />
                        </View>
                        <View style={styles.valueRow}>
                            <Text style={styles.bigValue}>1.2</Text>
                            <Text style={[styles.subValue, { fontSize: 16, marginTop: 8 }]}>G</Text>
                        </View>
                        {/* G-Force Grid Mockup */}
                        <View style={styles.gForceGrid}>
                            <View style={styles.gridLineH} />
                            <View style={styles.gridLineV} />
                            <View style={styles.gForceDot} />
                        </View>
                    </View>
                </View>

                {/* Speed Heatmap */}
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
                            style={{
                                borderRadius: 8
                            }}
                            withInnerLines={true}
                            withOuterLines={false}
                        />
                    </View>
                </View>

                {/* Consumption Stats */}
                <View style={styles.consumptionCard}>
                    <View style={styles.circularProgress}>
                        <MaterialIcons name="local-gas-station" size={20} color="white" />
                        {/* Circle stroke mock */}
                        <View style={[styles.circleStrike, { borderRightColor: '#FFD700', borderBottomColor: '#FFD700' }]} />
                    </View>
                    <View style={styles.consItem}>
                        <Text style={styles.consLabel}>EST. RANGE</Text>
                        <Text style={styles.consValue}>142 <Text style={{ fontSize: 14, color: '#9CA3AF' }}>km</Text></Text>
                    </View>
                    <View style={[styles.consItem, { alignItems: 'flex-end' }]}>
                        <Text style={styles.consLabel}>AVG CONSUMPTION</Text>
                        <Text style={styles.consValue}>5.2 <Text style={{ fontSize: 14, color: '#9CA3AF' }}>L/100km</Text></Text>
                    </View>
                </View>

                {/* Squad Status Footer */}
                <View style={styles.squadFooter}>
                    <View>
                        <View style={styles.squadHeader}>
                            <Text style={styles.squadTitle}>Squad Status</Text>
                            <View style={styles.activeDot} />
                            <Text style={styles.activeMemberText}>3 Active</Text>
                        </View>
                        <View style={styles.memberAvatars}>
                            {/* Avatars */}
                            {[1, 2, 3].map(i => (
                                <View key={i} style={styles.squadAvatar}>
                                    <Text style={{ color: 'white', fontSize: 8 }}>User</Text>
                                </View>
                            ))}
                            <View style={[styles.squadAvatar, { backgroundColor: '#374151' }]}>
                                <Text style={{ color: 'white', fontSize: 10 }}>+2</Text>
                            </View>
                        </View>
                    </View>

                    {/* Microphone Button */}
                    <TouchableOpacity style={styles.micButton}>
                        <MaterialIcons name="graphic-eq" size={24} color="white" />
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
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    logoSubText: {
        color: '#9CA3AF',
        fontSize: 10,
        letterSpacing: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    zoneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF444420',
        borderWidth: 1,
        borderColor: '#EF444450',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    zoneButtonText: {
        color: '#EF4444',
        fontSize: 10,
        fontWeight: 'bold',
    },
    iconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#161925',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#1F2937',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 15,
        marginTop: 15,
    },
    cardHeaderSimple: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 10,
    },
    cardTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    liveIndicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        marginRight: 8,
    },
    liveBadge: {
        borderColor: '#EF4444',
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: '#EF444410',
    },
    liveBadgeText: {
        color: '#EF4444',
        fontSize: 10,
        fontWeight: 'bold',
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    timeText: {
        color: '#6B7280',
        fontSize: 10,
        fontFamily: 'monospace',
    },
    scrubberContainer: {
        height: 40,
        justifyContent: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#111827',
    },
    ticksRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 15,
    },
    tick: {
        width: 2,
        height: 6,
        backgroundColor: '#374151',
    },
    scrubberThumb: {
        position: 'absolute',
        top: 15, // Center vertically roughly
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FFD700',
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 25,
        paddingVertical: 15,
    },
    playPauseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 15,
    },
    gridCard: {
        flex: 1,
        marginBottom: 0,
        height: 160,
    },
    gridLabel: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: 'bold',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    bigValue: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        marginRight: 4,
    },
    subValue: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    leanGauge: {
        marginTop: 20,
        height: 60,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    gaugeArc: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#1F2937',
        borderTopColor: '#06B6D4',
        borderLeftColor: '#06B6D4',
        position: 'absolute',
        bottom: -30,
    },
    gaugeNeedle: {
        width: 2,
        height: 35,
        backgroundColor: 'white',
        transform: [{ rotate: '-20deg' }],
        transformOrigin: 'bottom center',
        position: 'absolute',
        bottom: 0,
    },
    gForceGrid: {
        marginTop: 20,
        height: 50,
        backgroundColor: '#111827',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#374151',
        position: 'relative',
    },
    gridLineH: {
        position: 'absolute',
        top: '50%',
        width: '100%',
        height: 1,
        backgroundColor: '#374151',
    },
    gridLineV: {
        position: 'absolute',
        left: '50%',
        height: '100%',
        width: 1,
        backgroundColor: '#374151',
    },
    gForceDot: {
        position: 'absolute',
        top: '30%',
        right: '20%',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        shadowColor: '#EF4444',
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    filterBtn: {
        backgroundColor: '#1F2937',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#374151',
    },
    filterBtnText: {
        color: '#FFD700',
        fontSize: 10,
    },
    consumptionCard: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    circularProgress: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    circleStrike: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: 'transparent',
        transform: [{ rotate: '-45deg' }],
    },
    consItem: {
        flex: 1,
    },
    consLabel: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    consValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    squadFooter: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    squadHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    squadTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 10,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#06B6D4',
        marginRight: 4,
    },
    activeMemberText: {
        color: '#06B6D4',
        fontSize: 10,
        fontWeight: 'bold',
    },
    memberAvatars: {
        flexDirection: 'row',
    },
    squadAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981', // Green like mockup
        marginRight: -6,
        borderWidth: 1,
        borderColor: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
    },
    micButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#06B6D410',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#06B6D450',
        shadowColor: '#06B6D4',
        shadowOpacity: 0.2,
        shadowRadius: 8,
    }
});

export default PerformanceScreen;
