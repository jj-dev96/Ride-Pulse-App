import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { ShopService } from '../services/ShopService';

const WishlistScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const insets = useSafeAreaInsets();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        const unsub = ShopService.subscribeToWishlist(user.id, async (ids) => {
            const safeIds = ids || [];
            setWishlistItems(safeIds);

            try {
                const allProducts = await ShopService.getProducts('all');
                const filtered = (allProducts || []).filter(p => safeIds.includes(p.id));
                setProducts(filtered);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsub();
    }, [user?.id]);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
        >
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>₹{item.price.toLocaleString()}</Text>
                <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => ShopService.toggleWishlist(user.id, item)}
                >
                    <Ionicons name="heart" size={24} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="heart-outline" size={80} color="#374151" />
            </View>
            <Text style={styles.emptyTitle}>WISHLIST IS EMPTY</Text>
            <Text style={styles.emptySubtitle}>Save the gear you want for your next mission.</Text>
            <TouchableOpacity
                style={styles.shopNowBtn}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.shopNowText}>EXPLORE STORE</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0F111A', '#161925']} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>SAVED GEAR</Text>
                    <View style={{ width: 40 }} />
                </View>

                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color="#FFD700" />
                    </View>
                ) : (
                    <FlatList
                        data={products}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 180 }]}
                        ListEmptyComponent={renderEmpty}
                    />
                )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F111A' },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },

    listContent: { padding: 20 },
    row: { justifyContent: 'space-between' },
    productCard: { width: '48%', backgroundColor: '#1F2937', borderRadius: 20, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#374151' },
    productImage: { width: '100%', height: 160, backgroundColor: 'white', resizeMode: 'contain' },
    productInfo: { padding: 12 },
    productName: { color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
    productPrice: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
    removeBtn: { position: 'absolute', bottom: 10, right: 10 },

    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    emptySubtitle: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
    shopNowBtn: { marginTop: 30, backgroundColor: '#FFD700', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
    shopNowText: { color: 'black', fontWeight: 'bold', fontSize: 14 },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});

export default WishlistScreen;
