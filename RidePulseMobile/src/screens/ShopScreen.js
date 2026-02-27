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
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

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
    const userId = auth().currentUser?.uid;

    // Fetch products from Firebase
    useEffect(() => {
        const unsub = firestore().collection('products').onSnapshot(snapshot => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Fetch cart and wishlist
    useEffect(() => {
        if (!userId) return;
        const cartUnsub = firestore().collection('users').doc(userId).collection('cart').onSnapshot(snapshot => {
            setCart(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const wishUnsub = firestore().collection('users').doc(userId).collection('wishlist').onSnapshot(snapshot => {
            setWishlist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => { cartUnsub(); wishUnsub(); };
    }, [userId]);

    const filteredProducts = useMemo(() => {
        if (activeCategory === 'all') return products;
        return products.filter(p => p.category === activeCategory);
    }, [products, activeCategory]);

    const addToCart = (product) => {
        if (!userId) return;
        const cartRef = firestore().collection('users').doc(userId).collection('cart').doc(product.id);
        cartRef.get().then(doc => {
            if (doc.exists) {
                cartRef.update({ quantity: (doc.data().quantity || 1) + 1 });
            } else {
                cartRef.set({ ...product, quantity: 1 });
            }
        });
    };

    const toggleWishlist = (product) => {
        if (!userId) return;
        const wishRef = firestore().collection('users').doc(userId).collection('wishlist').doc(product.id);
        wishRef.get().then(doc => {
            if (doc.exists) {
                wishRef.delete();
            } else {
                wishRef.set(product);
            }
        });
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
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>RIDER STORE</Text>
                        <Text style={styles.headerSubtitle}>Premium gear for the road</Text>
                    </View>
                    <TouchableOpacity style={styles.cartBtn} onPress={() => {/* TODO: Open cart modal */}}>
                        <Ionicons name="cart-outline" size={28} color="#FFD700" />
                        {cart.length > 0 && <View style={styles.cartBadge}><Text style={{ color: 'white', fontSize: 10 }}>{cart.length}</Text></View>}
                    </TouchableOpacity>
                </View>
                {/* Categories */}
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
                {/* Product List */}
                {filteredProducts.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ color: '#FFD700', fontSize: 16 }}>No products available in this category.</Text>
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
            {/* Bottom Navigation */}
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#161925', flexDirection: 'row', justifyContent: 'space-around', padding: 12, borderTopWidth: 1, borderColor: '#222' }}>
                <TouchableOpacity onPress={() => {/* TODO: Open cart modal */}} style={{ alignItems: 'center' }}>
                    <Ionicons name="cart" size={24} color="#FFD700" />
                    <Text style={{ color: '#FFD700', fontSize: 12 }}>Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {/* TODO: Open wishlist modal */}} style={{ alignItems: 'center' }}>
                    <MaterialIcons name="favorite" size={24} color="#FFD700" />
                    <Text style={{ color: '#FFD700', fontSize: 12 }}>Wishlist</Text>
                </TouchableOpacity>
            </View>
            {/* Webview Modal */}
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
        id: '4',
        category: 'electronics',
        name: 'Bobo BM4 Mobile Holder',
        price: '₹1,450',
        image: 'https://m.media-amazon.com/images/I/71Nn+9XjGgL._AC_SL1500_.jpg',
        url: 'https://www.amazon.in/BOBO-BM4-Bicycle-Motorbike-Aluminum/dp/B07S7C71T3',
        site: 'Amazon',
        description: 'Secure aluminum mobile holder with 360 rotation.'
    },
    {
        id: '5',
        category: 'maint',
        name: 'Motul C2 Chain Lube',
        price: '₹550',
        image: 'https://m.media-amazon.com/images/I/61I2lWj8WJL._AC_SL1500_.jpg',
        url: 'https://www.amazon.in/Motul-C2-Chain-Lube-Road/dp/B007K7Z0D6',
        site: 'Amazon',
        description: 'Performance lubricant for all types of motorcycle chains.'
    },
    {
        id: '6',
        category: 'riding',
        name: 'Royal Enfield Shot Boots',
        price: '₹4,500',
        image: 'https://store.royalenfield.com/cdn/shop/products/1_569a7b97-1589-4e7a-9694-032a188f8c4e.jpg?v=1658488824',
        url: 'https://store.royalenfield.com/en/tcx-stich-black-boots',
        site: 'RE Store',
        description: 'Durable leather riding boots with ankle protection.'
    },
    {
        id: '7',
        category: 'travel',
        name: 'Guardian Gears Jaws Bag',
        price: '₹2,650',
        image: 'https://m.media-amazon.com/images/I/71Xm0p58F+L._AC_SL1500_.jpg',
        url: 'https://www.amazon.in/Guardian-Gears-Universal-Magnetic-Motorcycle/dp/B082F1S1MT',
        site: 'Amazon',
        description: 'Magnetic tank bag for easy access to essentials.'
    },
    {
        id: '8',
        category: 'electronics',
        name: 'BluArmor C30 Intercom',
        price: '₹10,999',
        image: 'https://bluarmor.com/cdn/shop/files/C30_Hero_1.png?v=1690000000',
        url: 'https://bluarmor.com/products/c30',
        site: 'BluArmor',
        description: 'Advanced mesh intercom with world-class noise cancellation.'
    },
    {
        id: '9',
        category: 'riding',
        name: 'TVS Racing Gloves',
        price: '₹1,599',
        image: 'https://m.media-amazon.com/images/I/71Xm0p58F+L._AC_SL1500_.jpg', // Place-holder image similar to TVS gloves
        url: 'https://www.amazon.in/TVS-Ventilation-Protection-Compatible-Fingertips-Premium/dp/B0BFW8S7RN',
        site: 'Amazon',
        description: 'Premium ventilation and protection with touch-compatible fingertips.'
    },
    {
        id: '10',
        category: 'riding',
        name: 'ZIGLY Knee & Elbow Guards',
        price: '₹799',
        image: 'https://m.media-amazon.com/images/I/71uVvO7uW1L._AC_SL1500_.jpg', // Representative image for knee/elbow protectors
        url: 'https://www.amazon.in/ZIGLY-Motorcycle-Cycling-Elbow-Protector/dp/B07TVJWJZL',
        site: 'Amazon',
        description: 'Hard shell protection for knees and elbows with adjustable straps.'
    }
];

const ShopScreen = () => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isWebViewVisible, setWebViewVisible] = useState(false);

    const filteredProducts = activeCategory === 'all'
        ? PRODUCTS
        : PRODUCTS.filter(p => p.category === activeCategory);

    const openProduct = (product) => {
        setSelectedProduct(product);
        setWebViewVisible(true);
    };

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => openProduct(item)}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <View style={styles.siteBadge}>
                    <Text style={styles.siteBadgeText}>{item.site}</Text>
                </View>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>{item.price}</Text>
                    <TouchableOpacity style={styles.buyButton} onPress={() => openProduct(item)}>
                        <Text style={styles.buyButtonText}>VIEW</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0F111A', '#161925', '#0F111A']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>RIDER STORE</Text>
                        <Text style={styles.headerSubtitle}>Premium gear for the road</Text>
                    </View>
                    <TouchableOpacity style={styles.cartBtn}>
                        <Ionicons name="cart-outline" size={28} color="#FFD700" />
                        <View style={styles.cartBadge} />
                    </TouchableOpacity>
                </View>

                {/* Categories */}
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

                {/* Product List */}
                <FlatList
                    data={filteredProducts}
                    renderItem={renderProduct}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.productList}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={styles.row}
                />
            </SafeAreaView>

            {/* Webview Modal (The "iFrame" feature) */}
            <Modal
                visible={isWebViewVisible}
                animationType="slide"
                onRequestClose={() => setWebViewVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => setWebViewVisible(false)}
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
