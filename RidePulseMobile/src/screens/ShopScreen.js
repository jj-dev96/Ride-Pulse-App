import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Dimensions,
    SafeAreaView,
    Modal,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { db, auth } from '../config/firebase';
import { collection, doc, onSnapshot, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { id: 'all', name: 'All Gear', icon: 'shopping-bag' },
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

const ShopScreen = () => {
    const [activeCategory, setActiveCategory] = useState('all');
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
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 100 }} color="#FFD700" size="large" />;

    return (
        <View style={styles.container}>
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
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 1,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    cartBtn: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#1F2937',
    },
    categoriesContainer: {
        marginBottom: 20,
    },
    categoriesList: {
        paddingHorizontal: 20,
    },
    categoryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F293780',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#FFD70040',
    },
    categoryBtnActive: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    categoryText: {
        color: '#FFD700',
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 12,
    },
    categoryTextActive: {
        color: '#000',
    },
    productList: {
        paddingHorizontal: 15,
        paddingBottom: 100,
    },
    row: {
        justifyContent: 'space-between',
    },
    card: {
        width: (width - 45) / 2,
        backgroundColor: '#1F2937',
        borderRadius: 15,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#374151',
    },
    imageContainer: {
        height: 160,
        backgroundColor: '#fff',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    siteBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#00000099',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
    },
    siteBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardContent: {
        padding: 12,
    },
    productName: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    productDesc: {
        color: '#9CA3AF',
        fontSize: 10,
        lineHeight: 14,
        height: 28,
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: '900',
    },
    buyButton: {
        backgroundColor: '#FFD70020',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    buyButtonText: {
        color: '#FFD700',
        fontSize: 10,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#0F111A',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
    },
    closeBtn: {
        padding: 5,
    },
    modalTitleContainer: {
        flex: 1,
        marginLeft: 15,
    },
    modalTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalSub: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    shareBtn: {
        padding: 5,
    },
    webview: {
        flex: 1,
        backgroundColor: 'white',
    },
    loader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F111A',
    }
});

export default ShopScreen;
