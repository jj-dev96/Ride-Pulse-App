import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Dimensions,
    TextInput,
    ActivityIndicator,
    Alert,
    Platform,
    UIManager,
    ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { ShopService } from '../services/ShopService';
import { CartItem, MainTabParamList, Product, RootStackParamList } from '../types';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

const CATEGORIES: Category[] = [
    { id: 'all', name: 'All Gear', icon: 'shopping-bag' },
    { id: 'helmets', name: 'Helmets', icon: 'user-secret' },
    { id: 'gloves', name: 'Gloves', icon: 'hand-paper' },
    { id: 'jackets', name: 'Jackets', icon: 'user-shield' },
    { id: 'boots', name: 'Boots', icon: 'shoe-prints' },
    { id: 'guards', name: 'Guards', icon: 'shield-alt' },
    { id: 'electronics', name: 'Electronics', icon: 'camera' },
    { id: 'accessories', name: 'Accessories', icon: 'mobile-alt' },
    { id: 'luggage', name: 'Luggage', icon: 'briefcase' },
    { id: 'lights', name: 'LED Lights', icon: 'lightbulb' },
    { id: 'tools', name: 'Tools', icon: 'wrench' },
];

type Props = BottomTabScreenProps<MainTabParamList, 'Shop'>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

const INITIAL_PRODUCTS: Product[] = [
    {
        id: 'h1',
        name: 'MT Hummer Helmet - Red',
        category: 'helmets',
        price: 5250,
        stock: 12,
        description: 'Aerodynamic shell with multi-density EPS and Pinlock vision.',
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=500&q=80'
    },
    {
        id: 'h2',
        name: 'AGV Pista GP RR - Carbon',
        category: 'helmets',
        price: 135000,
        stock: 2,
        description: 'The ultimate track helmet, 100% carbon fiber. Aerodynamic perfection.',
        rating: 5.0,
        imageUrl: 'https://images.unsplash.com/photo-1583244242630-335cfa3265da?auto=format&fit=crop&w=500&q=80'
    },
    {
        id: 'j1',
        name: 'Rynox Stealth EVO V3',
        category: 'jackets',
        price: 13450,
        stock: 5,
        description: 'Heavy-duty 600D cordura with KNOX level 2 armor.',
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&w=500&q=80'
    },
    {
        id: 'j2',
        name: 'Alpinestars GP Plus R V3',
        category: 'jackets',
        price: 48999,
        stock: 4,
        description: 'Premium bovine leather jacket with Nucleon Flex armor.',
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=500&q=80'
    },
    {
        id: 'g1',
        name: 'TVS Racing Pro Gloves',
        category: 'gloves',
        price: 2499,
        stock: 20,
        description: 'Carbon fiber knuckle protection with pre-curved fingers.',
        rating: 4.5,
        imageUrl: 'https://images.unsplash.com/photo-1510414842594-a6186905a141?auto=format&fit=crop&w=500&q=80'
    },
    {
        id: 'b1',
        name: 'TCX RT-Race Pro Air',
        category: 'boots',
        price: 32500,
        stock: 6,
        description: 'High-performance racing boots with D.F.C. system.',
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=500&q=80'
    },
    {
        id: 'e1',
        name: 'Sena 50R Intercom',
        category: 'electronics',
        price: 28500,
        stock: 3,
        description: 'Mesh 2.0 technology with Sound by Harman Kardon.',
        rating: 5.0,
        imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=500&q=80'
    },
    {
        id: 'a1',
        name: 'Quad Lock Vibration Dampener',
        category: 'accessories',
        price: 2199,
        stock: 50,
        description: 'Protect your smartphone camera with precision damping.',
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1588607316921-2c064972e796?auto=format&fit=crop&w=500&q=80'
    },
    {
        id: 'l1',
        name: 'Kriega US-20 Drypack',
        category: 'luggage',
        price: 12500,
        stock: 8,
        description: '100% waterproof tail pack with versatile mounting.',
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80'
    }
];

const ShopScreen: React.FC<Props> = () => {
    const { user } = useContext(AuthContext);
    const navigation = useNavigation<RootNav>();
    const insets = useSafeAreaInsets();

    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [cartCount, setCartCount] = useState<number>(0);
    const [wishlist, setWishlist] = useState<string[]>([]);

    useEffect(() => {
        if (!user?.id) return;

        const unsubCart = ShopService.subscribeToCart(user.id, (items: CartItem[]) => {
            const count = (items || []).reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
        });

        const unsubWishlist = ShopService.subscribeToWishlist(user.id, (items: string[]) => {
            setWishlist(items || []);
        });

        return () => {
            unsubCart();
            unsubWishlist();
        };
    }, [user?.id]);

    const fetchProducts = async (): Promise<void> => {
        setLoading(true);
        try {
            let items = await ShopService.getProducts(activeCategory, searchQuery);

            // Auto-update items with broken URLs
            let needsUpdate = false;
            items = items.map(item => {
                const initial = INITIAL_PRODUCTS.find(p => p.id === item.id);
                if (initial && item.imageUrl !== initial.imageUrl) {
                    needsUpdate = true;
                    return { ...item, imageUrl: initial.imageUrl };
                }
                return item;
            });

            if (needsUpdate) {
                // Silently update the DB in the background to fix the broken image URLs
                ShopService.seedProducts(items).catch(console.error);
            }

            if (items.length === 0 && activeCategory === 'all' && !searchQuery) {
                await ShopService.seedProducts(INITIAL_PRODUCTS);
                setProducts(INITIAL_PRODUCTS);
            } else {
                setProducts(items);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [activeCategory]);

    useEffect(() => {
        const delay = setTimeout(() => {
            fetchProducts();
        }, 500);
        return () => clearTimeout(delay);
    }, [searchQuery]);

    const handleAddToCart = async (product: Product): Promise<void> => {
        if (!user?.id) return;
        try {
            await ShopService.addToCart(user.id, product);
            Alert.alert("Success", "Added to your garage cart!");
        } catch (error: unknown) {
            const err = error as { message?: string };
            Alert.alert("Error", err.message || "Failed to add to cart");
        }
    };

    const handleToggleWishlist = async (product: Product): Promise<void> => {
        if (!user?.id) return;
        try {
            await ShopService.toggleWishlist(user.id, product);
        } catch (error) {
            console.error(error);
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.headerTitle}>RIDER STORE</Text>
                    <Text style={styles.headerSubtitle}>Equip for the next mission</Text>
                </View>
                <TouchableOpacity
                    style={styles.cartBtn}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <Ionicons name="cart-outline" size={26} color="#FFD700" />
                    {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search helmets, gear, parts..."
                    placeholderTextColor="#4B5563"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}
                contentContainerStyle={styles.categoriesContent}
            >
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryItem, activeCategory === cat.id && styles.categoryItemActive]}
                        onPress={() => setActiveCategory(cat.id)}
                    >
                        <FontAwesome5
                            name={cat.icon}
                            size={14}
                            color={activeCategory === cat.id ? '#000' : '#FFD700'}
                        />
                        <Text style={[styles.categoryText, activeCategory === cat.id && styles.categoryTextActive]}>
                            {cat.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderProduct = ({ item }: ListRenderItemInfo<Product>) => {
        const isLiked = (wishlist || []).includes(item.id);

        return (
            <View style={styles.productCard}>
                <TouchableOpacity
                    style={styles.productImageWrapper}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('ProductDetails', { product: item })}
                >
                    <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                    <TouchableOpacity
                        style={styles.wishlistBtn}
                        onPress={() => handleToggleWishlist(item)}
                    >
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={20}
                            color={isLiked ? "#EF4444" : "white"}
                        />
                    </TouchableOpacity>
                    {(item.stock ?? 99) < 5 && (
                        <View style={styles.stockBadge}>
                            <Text style={styles.stockText}>ONLY {item.stock} LEFT</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.productInfo}>
                    <Text style={styles.productCategory}>{item.category?.toUpperCase()}</Text>
                    <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>

                    <View style={styles.ratingRow}>
                        <FontAwesome name="star" size={12} color="#FFD700" />
                        <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '0.0'}</Text>
                    </View>

                    <View style={styles.productBottomRow}>
                        <Text style={styles.productPrice}>₹{item.price.toLocaleString()}</Text>
                        <TouchableOpacity
                            style={styles.addToCartSmall}
                            onPress={() => handleAddToCart(item)}
                        >
                            <Ionicons name="add" size={20} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="shopping-basket" size={80} color="#374151" />
            <Text style={styles.emptyTitle}>NO GEAR FOUND</Text>
            <Text style={styles.emptySubtitle}>We couldn't find any products in this category.</Text>
            <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                }}
            >
                <Text style={styles.resetBtnText}>CLEAR FILTERS</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0F111A', '#161925']} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <FlatList
                    ListHeaderComponent={renderHeader}
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.productRow}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 160 }]}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        fetchProducts();
                    }}
                    ListEmptyComponent={!loading ? renderEmpty : null}
                />

                {loading && (
                    <View style={styles.fullLoader}>
                        <ActivityIndicator size="large" color="#FFD700" />
                        <Text style={styles.loadingText}>Sourcing Gear...</Text>
                    </View>
                )}

                <View style={[styles.bottomHub, { bottom: insets.bottom + 85 }]}>
                    <LinearGradient
                        colors={['#1F2937CC', '#161925CC']}
                        style={styles.bottomHubInner}
                    >
                        <TouchableOpacity
                            style={[styles.hubBtn, { flex: 1 }]}
                            onPress={() => navigation.navigate('Wishlist')}
                        >
                            <View style={{ alignItems: 'center' }}>
                                <Ionicons name="heart-outline" size={24} color="#FFD700" />
                                {wishlist.length > 0 && <View style={styles.hubBadge} />}
                                <Text style={styles.hubBtnText}>Wishlist</Text>
                            </View>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F111A' },
    safeArea: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 10 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
    headerSubtitle: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
    cartBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#374151' },
    cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1F2937' },
    cartBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 16, paddingHorizontal: 15, height: 50, marginBottom: 20, borderWidth: 1, borderColor: '#374151' },
    searchInput: { flex: 1, color: 'white', fontSize: 14, marginLeft: 10 },
    categoriesScroll: { marginBottom: 20 },
    categoriesContent: { paddingRight: 20 },
    categoryItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, marginRight: 10, backgroundColor: '#1F293780', borderWidth: 1, borderColor: '#374151' },
    categoryItemActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
    categoryText: { color: '#9CA3AF', fontWeight: 'bold', fontSize: 12, marginLeft: 8 },
    categoryTextActive: { color: 'black' },
    scrollContent: { paddingHorizontal: 15 },
    productRow: { justifyContent: 'space-between' },
    productCard: { width: (width - 45) / 2, backgroundColor: '#1F2937', borderRadius: 20, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#374151' },
    productImageWrapper: { height: 180, width: '100%', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
    productImage: { width: '80%', height: '80%', resizeMode: 'contain' },
    wishlistBtn: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
    stockBadge: { position: 'absolute', bottom: 0, left: 0, backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4 },
    stockText: { color: 'white', fontSize: 8, fontWeight: 'bold' },
    productInfo: { padding: 12 },
    productCategory: { color: '#6B7280', fontSize: 8, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
    productName: { color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    ratingText: { color: '#9CA3AF', fontSize: 10, marginLeft: 4, fontWeight: 'bold' },
    productBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productPrice: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },
    addToCartSmall: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' },
    bottomHub: { position: 'absolute', left: 20, right: 20, zIndex: 100 },
    bottomHubInner: { flexDirection: 'row', backgroundColor: 'rgba(31, 41, 55, 0.95)', borderRadius: 30, paddingVertical: 12, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15, elevation: 10, justifyContent: 'space-around', alignItems: 'center' },
    hubBtn: { alignItems: 'center' },
    hubBtnText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
    hubBadge: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD700', borderWidth: 1, borderColor: '#1F2937' },
    fullLoader: { position: 'absolute', top: 300, left: 0, right: 0, alignItems: 'center' },
    loadingText: { color: '#9CA3AF', fontSize: 12, marginTop: 15, fontWeight: 'bold', letterSpacing: 1 },
    emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 20 },
    emptySubtitle: { color: '#9CA3AF', textAlign: 'center', fontSize: 13, marginTop: 10, lineHeight: 20 },
    resetBtn: { marginTop: 30, backgroundColor: '#FFD70020', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FFD700' },
    resetBtnText: { color: '#FFD700', fontWeight: 'bold', fontSize: 12 },
});

export default ShopScreen;
