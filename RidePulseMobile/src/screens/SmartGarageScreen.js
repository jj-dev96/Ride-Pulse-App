import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Modal, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const BIKES = {
    Yamaha: [
        { model: 'YZF-R6', hp: 117, torque: 61, weight: 190 },
        { model: 'R1M', hp: 197, torque: 113, weight: 200 },
        { model: 'MT-09', hp: 117, torque: 93, weight: 189 },
    ],
    Ducati: [
        { model: 'Panigale V4', hp: 214, torque: 124, weight: 175 },
        { model: 'Monster', hp: 111, torque: 93, weight: 166 },
    ],
    BMW: [
        { model: 'S1000RR', hp: 205, torque: 113, weight: 197 },
        { model: 'M1000RR', hp: 212, torque: 113, weight: 192 },
    ],
    Kawasaki: [
        { model: 'Ninja H2', hp: 228, torque: 141, weight: 238 },
        { model: 'ZX-10R', hp: 200, torque: 114, weight: 207 },
    ]
};

const SmartGarageScreen = ({ navigation }) => {
    // State
    const [selectedMake, setSelectedMake] = useState('Yamaha');
    const [selectedModel, setSelectedModel] = useState(BIKES['Yamaha'][0]);

    // Modals
    const [showMakeModal, setShowMakeModal] = useState(false);
    const [showModelModal, setShowModelModal] = useState(false);

    // Visualizer Bars (Mock)
    const bars = [10, 20, 30, 45, 60, 75, 80, 85, 90, 85, 80, 75, 60, 50, 40, 30, 25, 20, 15, 10];

    const handleMakeSelect = (make) => {
        setSelectedMake(make);
        setSelectedModel(BIKES[make][0]); // Auto-select first model
        setShowMakeModal(false);
    };

    const handleModelSelect = (model) => {
        setSelectedModel(model);
        setShowModelModal(false);
    };

    const handleSave = () => {
        Alert.alert(
            "Neuro-Link Established",
            `Configuration saved for ${selectedMake} ${selectedModel.model}.`,
            [{ text: "OK" }]
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
            <SafeAreaView edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>SMART GARAGE</Text>
                    {/* Small Logo in Header */}
                    <Image
                        source={require('../../assets/RidePulse-Logo.jpg')}
                        style={styles.headerLogo}
                        resizeMode="cover"
                    />
                </View>

                {/* Rider Identity Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <FontAwesome5 name="id-card" size={14} color="#FFD700" />
                        <Text style={styles.sectionTitle}>RIDER IDENTITY</Text>
                    </View>

                    <View style={styles.card}>
                        {/* Circular Photo Upload */}
                        <View style={styles.uploadContainer}>
                            <TouchableOpacity style={styles.uploadCircle}>
                                <Image
                                    source={require('../../assets/RidePulse-Logo.jpg')}
                                    style={{ width: '100%', height: '100%', opacity: 0.8 }}
                                />
                                <View style={styles.uploadOverlay}>
                                    <Text style={styles.uploadText}>EDIT PHOTO</Text>
                                </View>
                            </TouchableOpacity>
                            {/* Decorative ring */}
                            <View style={styles.photoRing} />
                        </View>

                        <View style={styles.formRow}>
                            <View style={styles.inputGroupSmall}>
                                <Text style={styles.label}>BLOOD TYPE</Text>
                                <View style={styles.dropdownInput}>
                                    <Text style={styles.inputText}>A+</Text>
                                    <MaterialIcons name="keyboard-arrow-down" size={20} color="#6B7280" />
                                </View>
                            </View>
                            <View style={styles.inputGroupLarge}>
                                <Text style={styles.label}>LICENSE NO.</Text>
                                <View style={styles.textInputContainer}>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="XX-00-XX-0000"
                                        placeholderTextColor="#4B5563"
                                        defaultValue="RP-2024-X99"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Machine Configuration Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <FontAwesome5 name="motorcycle" size={14} color="#06B6D4" />
                        <Text style={styles.sectionTitle}>MACHINE CONFIGURATION</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.topRightTag}>
                            <Text style={styles.tagText}>MANUAL START</Text>
                        </View>

                        {/* Manufacturer Dropdown */}
                        <View style={styles.inputGroupFull}>
                            <Text style={styles.label}>MANUFACTURER</Text>
                            <TouchableOpacity
                                style={styles.dropdownInput}
                                onPress={() => setShowMakeModal(true)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={styles.brandIcon} />
                                    <Text style={styles.inputText}>{selectedMake}</Text>
                                </View>
                                <MaterialIcons name="keyboard-arrow-down" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Model Dropdown */}
                        <View style={styles.inputGroupFull}>
                            <Text style={styles.label}>MODEL</Text>
                            <TouchableOpacity
                                style={styles.dropdownInput}
                                onPress={() => setShowModelModal(true)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <FontAwesome5 name="motorcycle" size={16} color="white" style={{ marginRight: 10 }} />
                                    <Text style={styles.inputText}>{selectedModel.model}</Text>
                                </View>
                                <MaterialIcons name="keyboard-arrow-down" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Power Stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>POWER</Text>
                                <Text style={styles.statValue}>{selectedModel.hp} <Text style={styles.statUnit}>HP</Text></Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>TORQUE</Text>
                                <Text style={styles.statValue}>{selectedModel.torque} <Text style={styles.statUnit}>NM</Text></Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>WEIGHT</Text>
                                <Text style={styles.statValue}>{selectedModel.weight} <Text style={styles.statUnit}>KG</Text></Text>
                            </View>
                        </View>

                        {/* Visualizer Chart */}
                        <View style={styles.visualizerContainer}>
                            {bars.map((height, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.bar,
                                        {
                                            height: `${height}%`,
                                            backgroundColor: '#06B6D4',
                                            opacity: height / 100
                                        }
                                    ]}
                                />
                            ))}
                            <View style={styles.gridLines}>
                                <View style={styles.gridLine} />
                                <View style={[styles.gridLine, { top: '60%' }]} />
                            </View>
                        </View>

                    </View>
                </View>

                {/* Footer Action */}
                <TouchableOpacity style={styles.initButton} onPress={handleSave}>
                    <LinearGradient
                        colors={['#FFD700', '#F59E0B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.initButtonText}>SAVE CONFIGURATION</Text>
                        <MaterialIcons name="save" size={16} color="black" />
                    </LinearGradient>
                </TouchableOpacity>

            </SafeAreaView>

            {/* Make Modal */}
            <Modal visible={showMakeModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Manufacturer</Text>
                        <FlatList
                            data={Object.keys(BIKES)}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => handleMakeSelect(item)}>
                                    <Text style={styles.modalItemText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowMakeModal(false)}>
                            <Text style={styles.closeBtnText}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Model Modal */}
            <Modal visible={showModelModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Model</Text>
                        <FlatList
                            data={BIKES[selectedMake]}
                            keyExtractor={(item) => item.model}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => handleModelSelect(item)}>
                                    <Text style={styles.modalItemText}>{item.model}</Text>
                                    <Text style={styles.modalItemSub}>{item.hp} HP</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowModelModal(false)}>
                            <Text style={styles.closeBtnText}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    headerLogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#06B6D4'
    },
    sectionContainer: {
        marginBottom: 25,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#161925',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    uploadContainer: {
        alignItems: 'center',
        marginBottom: 25,
        marginTop: 10,
    },
    uploadCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        overflow: 'hidden',
    },
    uploadOverlay: {
        position: 'absolute',
        bottom: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    uploadText: {
        color: '#FFD700',
        fontSize: 8,
        fontWeight: 'bold',
    },
    photoRing: {
        position: 'absolute',
        top: -5,
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 2,
        borderColor: '#FFD700',
        zIndex: 1,
        shadowColor: '#FFD700',
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    formRow: {
        flexDirection: 'row',
        gap: 15,
    },
    inputGroupSmall: {
        flex: 1,
    },
    inputGroupLarge: {
        flex: 2,
    },
    inputGroupFull: {
        marginBottom: 15,
    },
    label: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    dropdownInput: {
        backgroundColor: '#111827',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
    },
    textInputContainer: {
        backgroundColor: '#111827',
        padding: 4,
        borderRadius: 8,
    },
    textInput: {
        color: 'white',
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        fontWeight: 'bold',
    },
    inputText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    topRightTag: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: '#06B6D410',
        borderWidth: 1,
        borderColor: '#06B6D4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        zIndex: 5,
    },
    tagText: {
        color: '#06B6D4',
        fontSize: 10,
        fontWeight: 'bold',
    },
    brandIcon: {
        width: 16,
        height: 16,
        backgroundColor: '#9CA3AF',
        borderRadius: 2,
        marginRight: 10,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#1F2937',
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
        marginBottom: 5,
    },
    statValue: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    statUnit: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    visualizerContainer: {
        height: 80,
        backgroundColor: '#111827',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: 10,
        position: 'relative',
        overflow: 'hidden',
    },
    bar: {
        width: 4,
        borderRadius: 2,
    },
    gridLines: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
    },
    gridLine: {
        height: 1,
        backgroundColor: '#1F2937',
        width: '100%',
        marginVertical: 10,
    },
    initButton: {
        marginTop: 10,
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#FFD700',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    gradientButton: {
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    initButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#161925',
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
    },
    modalItemText: {
        color: 'white',
        fontSize: 16,
    },
    modalItemSub: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 2,
    },
    closeBtn: {
        marginTop: 20,
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#1F2937',
        borderRadius: 8,
    },
    closeBtnText: {
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    // Health Monitor Styles
    healthRow: {
        marginBottom: 10,
    },
    healthLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    healthLabel: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: 'bold',
    },
    healthValue: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: 'bold',
    },
    healthSub: {
        color: '#4B5563',
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#111827',
        borderRadius: 3,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    divider: {
        height: 1,
        backgroundColor: '#1F2937',
        marginVertical: 15,
    },
    tyreRow: {
        flexDirection: 'row',
        gap: 10,
    },
    tyreBadge: {
        flex: 1,
        backgroundColor: '#111827',
        borderRadius: 8,
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#374151',
    },
    tyrePos: {
        color: '#6B7280',
        fontWeight: 'bold',
        fontSize: 12,
    },
    tyreVal: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    statusRowSimple: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#111827',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusTextSimple: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    serviceLogBtn: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 8,
        gap: 8,
    },
    serviceLogText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    }
});

export default SmartGarageScreen;
