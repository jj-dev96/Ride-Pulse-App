<<<<<<< HEAD
import React, { useState, useEffect, useMemo } from 'react';
=======
import React, { useState, useEffect, useContext, useMemo } from 'react';
>>>>>>> feb14-version
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
    LayoutAnimation,
    UIManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
<<<<<<< HEAD
import { WebView } from 'react-native-webview';
import { db, auth } from '../config/firebase';
import { collection, doc, onSnapshot, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
=======
import { AuthContext } from '../context/AuthContext';
import { ShopService } from '../services/ShopService';
>>>>>>> feb14-version

const { width } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORIES = [
    { id: 'all', name: 'All Gear', icon: 'shopping-bag' },
<<<<<<< HEAD
    { id: 'helmets', name: 'Helmets', icon: 'hard-hat' },
    { id: 'riding', name: 'Riding Gear', icon: 'user-shield' },
    { id: 'gloves', name: 'Riding Gloves', icon: 'hand-rock' },
    { id: 'jackets', name: 'Jackets', icon: 'tshirt' },
    { id: 'boots', name: 'Boots', icon: 'shoe-prints' },
    { id: 'knee', name: 'Knee Guards', icon: 'shield-alt' },
    { id: 'pants', name: 'Riding Pants', icon: 'user' },
    { id: 'electronics', name: 'Electronics', icon: 'cpu' },
    { id: 'mounts', name: 'Mounts & Holders', icon: 'mobile-alt' },
    { id: 'accessories', name: 'Bike Accessories', icon: 'tools' },
    { id: 'luggage', name: 'Luggage & Bags', icon: 'suitcase' },
    { id: 'safety', name: 'Safety Gear', icon: 'exclamation-triangle' },
    { id: 'maintenance', name: 'Maintenance Tools', icon: 'wrench' },
    { id: 'performance', name: 'Performance Parts', icon: 'tachometer-alt' },
    { id: 'lights', name: 'LED Lights', icon: 'lightbulb' },
    { id: 'hydration', name: 'Hydration Gear', icon: 'tint' },
    { id: 'comm', name: 'Communication', icon: 'headset' },
];
=======
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

const ShopScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const insets = useSafeAreaInsets();
>>>>>>> feb14-version

    // UI State
    const [activeCategory, setActiveCategory] = useState('all');
<<<<<<< HEAD
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isWebViewVisible, setWebViewVisible] = useState(false);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = auth.currentUser?.uid;

    // Fetch products from Firebase
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'products'), snapshot => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Fetch cart and wishlist
    useEffect(() => {
        if (!userId) return;
        const cartUnsub = onSnapshot(collection(db, 'users', userId, 'cart'), snapshot => {
            setCart(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const wishUnsub = onSnapshot(collection(db, 'users', userId, 'wishlist'), snapshot => {
            setWishlist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => { cartUnsub(); wishUnsub(); };
    }, [userId]);

    const filteredProducts = useMemo(() => {
        if (activeCategory === 'all') return products;
        return products.filter(p => p.category === activeCategory);
    }, [products, activeCategory]);

    const addToCart = async (product) => {
        if (!userId) return;
        const cartRef = doc(db, 'users', userId, 'cart', product.id);
        const docSnap = await getDoc(cartRef);
        if (docSnap.exists()) {
            await updateDoc(cartRef, { quantity: (docSnap.data().quantity || 1) + 1 });
        } else {
            await setDoc(cartRef, { ...product, quantity: 1 });
        }
    };

    const toggleWishlist = async (product) => {
        if (!userId) return;
        const wishRef = doc(db, 'users', userId, 'wishlist', product.id);
        const docSnap = await getDoc(wishRef);
        if (docSnap.exists()) {
            await deleteDoc(wishRef);
        } else {
            await setDoc(wishRef, product);
        }
    };

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => setSelectedProduct(item)}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <View style={styles.siteBadge}>
                    <Text style={styles.siteBadgeText}>{item.site}</Text>
                </View>
                <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10 }} onPress={() => toggleWishlist(item)}>
                    <MaterialIcons name={wishlist.find(w => w.id === item.id) ? 'favorite' : 'favorite-border'} size={22} color="#FFD700" />
                </TouchableOpacity>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>{item.price}</Text>
                    <TouchableOpacity style={styles.buyButton} onPress={() => addToCart(item)}>
                        <Text style={styles.buyButtonText}>ADD TO CART</Text>
=======
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data State
    const [products, setProducts] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [wishlist, setWishlist] = useState([]);

    // Real-time Listeners
    useEffect(() => {
        if (!user?.id) return;

        const unsubCart = ShopService.subscribeToCart(user.id, (items) => {
            const count = (items || []).reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
        });

        const unsubWishlist = ShopService.subscribeToWishlist(user.id, (items) => {
            setWishlist(items || []);
        });

        return () => {
            unsubCart();
            unsubWishlist();
        };
    }, [user?.id]);

    // Fetch Products
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const items = await ShopService.getProducts(activeCategory, searchQuery);
            // If empty, seed some default data (for testing purposes based on requirements)
            if (items.length === 0 && activeCategory === 'all' && !searchQuery) {
                const initialProducts = [
                    {
                        id: 'h1',
                        name: 'MT Hummer Helmet - Red',
                        category: 'helmets',
                        price: 5250,
                        stock: 12,
                        description: 'Aerodynamic shell with multi-density EPS and Pinlock vision.',
                        rating: 4.8,
                        imageUrl: 'https://m.media-amazon.com/images/I/61k2cOqN0LL._AC_SL1500_.jpg'
                    },
                    {
                        id: 'j1',
                        name: 'Rynox Stealth EVO V3',
                        category: 'jackets',
                        price: 13450,
                        stock: 5,
                        description: 'Heavy-duty 600D cordura with KNOX level 2 armor.',
                        rating: 4.9,
                        imageUrl: 'https://rynoxgear.com/cdn/shop/files/StealthEvoJacket4.0_PhantomEdition_BlackandWhite.jpg?v=1733306381&width=1000'
                    },
                    {
                        id: 'g1',
                        name: 'TVS Racing Pro Gloves',
                        category: 'gloves',
                        price: 2499,
                        stock: 20,
                        description: 'Carbon fiber knuckle protection with pre-curved fingers.',
                        rating: 4.5,
                        imageUrl: 'https://m.media-amazon.com/images/I/71Xm0p58F+L._AC_SL1500_.jpg'
                    },
                    {
                        id: 'e1',
                        name: 'Sena 50R Intercom',
                        category: 'electronics',
                        price: 28500,
                        stock: 3,
                        description: 'Mesh 2.0 technology with Sound by Harman Kardon.',
                        rating: 5.0,
                        imageUrl: 'https://m.media-amazon.com/images/I/61IqLnt6oLL._AC_SL1000_.jpg'
                    }
                ];
                await ShopService.seedProducts(initialProducts);
                setProducts(initialProducts);
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

    // Debounced Search logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchProducts();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleAddToCart = async (product) => {
        if (!user?.id) return;
        try {
            await ShopService.addToCart(user.id, product);
            Alert.alert("Success", "Added to your garage cart!");
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    const handleToggleWishlist = async (product) => {
        if (!user?.id) return;
        try {
            await ShopService.toggleWishlist(user.id, product);
            // No feedback needed, heart will change color
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
>>>>>>> feb14-version
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
                        style={[
                            styles.categoryItem,
                            activeCategory === cat.id && styles.categoryItemActive
                        ]}
                        onPress={() => setActiveCategory(cat.id)}
                    >
                        <FontAwesome5
                            name={cat.icon}
                            size={14}
                            color={activeCategory === cat.id ? '#000' : '#FFD700'}
                        />
                        <Text style={[
                            styles.categoryText,
                            activeCategory === cat.id && styles.categoryTextActive
                        ]}>
                            {cat.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderProduct = ({ item }) => {
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
                    {item.stock < 5 && (
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
            <Text style={styles.emptySubtitle}>We couldn't find any products in this category matching your search.</Text>
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

    if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 100 }} color="#FFD700" size="large" />;

    return (
        <View style={styles.container}>
<<<<<<< HEAD
            <LinearGradient
                colors={['#0F111A', '#161925', '#0F111A']}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>RIDER STORE</Text>
                        <Text style={styles.headerSubtitle}>Premium gear for the road</Text>
                    </View>
                    <TouchableOpacity style={styles.cartBtn} onPress={() => { }}>
                        <Ionicons name="cart-outline" size={28} color="#FFD700" />
                        {cart.length > 0 && <View style={styles.cartBadge}><Text style={{ color: 'white', fontSize: 10 }}>{cart.length}</Text></View>}
                    </TouchableOpacity>
                </View>
                <View style={styles.categoriesContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesList}
                    >
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryBtn,
                                    activeCategory === cat.id && styles.categoryBtnActive
                                ]}
                                onPress={() => setActiveCategory(cat.id)}
                            >
                                <FontAwesome5
                                    name={cat.icon}
                                    size={16}
                                    color={activeCategory === cat.id ? '#000' : '#FFD700'}
                                />
                                <Text style={[
                                    styles.categoryText,
                                    activeCategory === cat.id && styles.categoryTextActive
                                ]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                {filteredProducts.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ color: '#FFD700', fontSize: 16 }}>No products available.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        renderItem={renderProduct}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        contentContainerStyle={styles.productList}
                        showsVerticalScrollIndicator={false}
                        columnWrapperStyle={styles.row}
                    />
                )}
            </SafeAreaView>
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#161925', flexDirection: 'row', justifyContent: 'space-around', padding: 12, borderTopWidth: 1, borderColor: '#222' }}>
                <TouchableOpacity onPress={() => { }} style={{ alignItems: 'center' }}>
                    <Ionicons name="cart" size={24} color="#FFD700" />
                    <Text style={{ color: '#FFD700', fontSize: 12 }}>Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { }} style={{ alignItems: 'center' }}>
                    <MaterialIcons name="favorite" size={24} color="#FFD700" />
                    <Text style={{ color: '#FFD700', fontSize: 12 }}>Wishlist</Text>
                </TouchableOpacity>
            </View>
            <Modal
                visible={!!selectedProduct}
                animationType="slide"
                onRequestClose={() => setSelectedProduct(null)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => setSelectedProduct(null)}
                            style={styles.closeBtn}
                        >
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                        <View style={styles.modalTitleContainer}>
                            <Text style={styles.modalTitle} numberOfLines={1}>
                                {selectedProduct?.name}
                            </Text>
                            <Text style={styles.modalSub}>{selectedProduct?.site}</Text>
                        </View>
                        <TouchableOpacity style={styles.shareBtn}>
                            <Ionicons name="share-outline" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    {selectedProduct && (
                        <WebView
                            source={{ uri: selectedProduct.url }}
                            style={styles.webview}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View style={styles.loader}>
                                    <ActivityIndicator size="large" color="#FFD700" />
=======
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
                    ListEmptyComponent={!loading && renderEmpty}
                />

                {loading && (
                    <View style={styles.fullLoader}>
                        <ActivityIndicator size="large" color="#FFD700" />
                        <Text style={styles.loadingText}>Sourcing Gear...</Text>
                    </View>
                )}

                {/* Bottom Store Hub */}
                <View style={[styles.bottomHub, { bottom: insets.bottom + 85 }]}>
                    <LinearGradient
                        colors={['#1F2937CC', '#161925CC']}
                        style={styles.bottomHubInner}
                    >
                        <TouchableOpacity style={styles.hubBtn}>
                            <Ionicons name="grid-outline" size={20} color="#FFD700" />
                            <Text style={styles.hubBtnText}>Browse</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.hubBtn}
                            onPress={() => navigation.navigate('Wishlist')}
                        >
                            <View>
                                <Ionicons name="heart-outline" size={20} color="#9CA3AF" />
                                {wishlist.length > 0 && <View style={styles.hubBadge} />}
                            </View>
                            <Text style={styles.hubBtnTextInactive}>Wishlist</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.hubBtn, styles.hubBtnCenter]}
                            onPress={() => navigation.navigate('Cart')}
                        >
                            <LinearGradient colors={['#FFD700', '#F59E0B']} style={styles.hubCartIcon}>
                                <Ionicons name="cart" size={22} color="black" />
                            </LinearGradient>
                            {cartCount > 0 && (
                                <View style={styles.hubCartBadge}>
                                    <Text style={styles.hubCartBadgeText}>{cartCount}</Text>
>>>>>>> feb14-version
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.hubBtn}>
                            <Ionicons name="receipt-outline" size={20} color="#9CA3AF" />
                            <Text style={styles.hubBtnTextInactive}>Orders</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.hubBtn}>
                            <Ionicons name="shield-outline" size={20} color="#9CA3AF" />
                            <Text style={styles.hubBtnTextInactive}>Safety</Text>
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
    hubBtnCenter: { marginTop: -35 },
    hubCartIcon: { width: 55, height: 55, borderRadius: 27.5, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#161925', shadowColor: '#FFD700', shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
    hubBtnText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
    hubBtnTextInactive: { color: '#6B7280', fontSize: 10, marginTop: 4 },
    hubBadge: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD700', borderWidth: 1, borderColor: '#1F2937' },
    hubCartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FFD700', minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#161925' },
    hubCartBadgeText: { color: 'black', fontSize: 11, fontWeight: '900' },

    fullLoader: { position: 'absolute', top: 300, left: 0, right: 0, alignItems: 'center' },
    loadingText: { color: '#9CA3AF', fontSize: 12, marginTop: 15, fontWeight: 'bold', letterSpacing: 1 },

    emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 20 },
    emptySubtitle: { color: '#9CA3AF', textAlign: 'center', fontSize: 13, marginTop: 10, lineHeight: 20 },
    resetBtn: { marginTop: 30, backgroundColor: '#FFD70020', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FFD700' },
    resetBtnText: { color: '#FFD700', fontWeight: 'bold', fontSize: 12 }
});

export default ShopScreen;
