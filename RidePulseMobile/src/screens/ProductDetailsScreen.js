import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { ShopService } from '../services/ShopService';

const { width, height } = Dimensions.get('window');

const ProductDetailsScreen = ({ route, navigation }) => {
    const { product } = route.params;
    const { user } = useContext(AuthContext);
    const insets = useSafeAreaInsets();
    const [adding, setAdding] = useState(false);

    const handleAddToCart = async () => {
        if (!user?.id) return;
        setAdding(true);
        try {
            await ShopService.addToCart(user.id, product);
            Alert.alert("Success", `${product.name} added to your garage!`);
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setAdding(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0F111A', '#161925']} style={StyleSheet.absoluteFill} />

            <View style={styles.imageHeader}>
                <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                <TouchableOpacity
                    style={[styles.headerBtn, { top: insets.top + 10, left: 20 }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.headerBtn, { top: insets.top + 10, right: 20 }]}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <Ionicons name="cart-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View style={styles.badgeRow}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{product.category?.toUpperCase()}</Text>
                        </View>
                        <View style={styles.ratingBadge}>
                            <FontAwesome name="star" size={14} color="#FFD700" />
                            <Text style={styles.ratingText}>{product.rating?.toFixed(1) || '4.5'}</Text>
                        </View>
                    </View>

                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>₹{product.price?.toLocaleString()}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>MISSION INTEL</Text>
                    <Text style={styles.description}>{product.description}</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <MaterialIcons name="inventory" size={24} color="#FFD700" />
                            <Text style={styles.statLabel}>STOCK</Text>
                            <Text style={styles.statValue}>{product.stock}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <MaterialIcons name="local-shipping" size={24} color="#FFD700" />
                            <Text style={styles.statLabel}>SHIPPING</Text>
                            <Text style={styles.statValue}>FAST</Text>
                        </View>
                        <View style={styles.statBox}>
                            <MaterialIcons name="verified" size={24} color="#FFD700" />
                            <Text style={styles.statLabel}>QUALITY</Text>
                            <Text style={styles.statValue}>ELITE</Text>
                        </View>
                    </View>

                    <View style={styles.specsContainer}>
                        <Text style={styles.sectionTitle}>GEAR SPECS</Text>
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Protection</Text>
                            <Text style={styles.specValue}>Level 2 Armored</Text>
                        </View>
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Material</Text>
                            <Text style={styles.specValue}>Reinforced Cordura</Text>
                        </View>
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Weather</Text>
                            <Text style={styles.specValue}>All Season</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    style={styles.cartBtn}
                    onPress={handleAddToCart}
                    disabled={adding}
                >
                    <LinearGradient
                        colors={['#FFD700', '#F59E0B']}
                        style={styles.cartGradient}
                    >
                        <Ionicons name="add" size={24} color="black" />
                        <Text style={styles.cartText}>ACQUIRE GEAR</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F111A' },
    imageHeader: { width: '100%', height: height * 0.45, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' },
    productImage: { width: '85%', height: '85%', resizeMode: 'contain' },
    headerBtn: { position: 'absolute', width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

    scrollContent: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 120 },
    badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    categoryBadge: { backgroundColor: '#FFD70020', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700' },
    categoryText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
    ratingText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },

    productName: { color: 'white', fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
    productPrice: { color: '#FFD700', fontSize: 24, fontWeight: '900', marginBottom: 20 },
    divider: { height: 1, backgroundColor: '#374151', marginVertical: 20 },

    sectionTitle: { color: '#6B7280', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 15 },
    description: { color: '#9CA3AF', fontSize: 15, lineHeight: 24, marginBottom: 30 },

    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
    statBox: { flex: 1, alignItems: 'center', backgroundColor: '#1F2937', paddingVertical: 15, borderRadius: 16, marginHorizontal: 5, borderWidth: 1, borderColor: '#374151' },
    statLabel: { color: '#6B7280', fontSize: 10, marginTop: 10, fontWeight: 'bold' },
    statValue: { color: 'white', fontSize: 14, fontWeight: 'bold', marginTop: 4 },

    specsContainer: { marginBottom: 30 },
    specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    specLabel: { color: '#9CA3AF', fontSize: 14 },
    specValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(15, 17, 26, 0.9)', borderTopWidth: 1, borderTopColor: '#1F2937' },
    cartBtn: { width: '100%' },
    cartGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 10 },
    cartText: { color: 'black', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});

export default ProductDetailsScreen;
