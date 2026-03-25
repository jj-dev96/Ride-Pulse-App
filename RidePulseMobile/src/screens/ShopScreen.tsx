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
    Linking,
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
    { id: 'all', name: 'All Gear', icon: 'th-large' },
    { id: 'helmets', name: 'Helmets', icon: 'mandalorian' },
    { id: 'gloves', name: 'Gloves', icon: 'hand-paper' },
    { id: 'jackets', name: 'Jackets', icon: 'user-shield' },
    { id: 'boots', name: 'Boots', icon: 'shoe-prints' },
    { id: 'guards', name: 'Guards', icon: 'shield-alt' },
    { id: 'electronics', name: 'Electronics', icon: 'microchip' },
    { id: 'luggage', name: 'Luggage', icon: 'suitcase-rolling' },
    { id: 'lights', name: 'LED Lights', icon: 'lightbulb' },
    { id: 'tools', name: 'Tools', icon: 'tools' },
    { id: 'accessories', name: 'Accessories', icon: 'toolbox' },
];

type Props = BottomTabScreenProps<MainTabParamList, 'Shop'>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

const INITIAL_PRODUCTS: Product[] = [
    {
        id: 'amz_mask',
        name: 'Boldfit Balaclava Mask',
        category: 'accessories',
        price: 225,
        imageUrl: require('../assets/Shop/mask.jpg'),
        url: 'https://www.amazon.in/gp/aw/d/B0BRY84H2H/'
    },
    {
        id: 'amz_gloves',
        name: 'TVS Racing Riding Gloves',
        category: 'gloves',
        price: 1294,
        imageUrl: require('../assets/Shop/gloves.webp'),
        url: 'https://www.amazon.in/TVS-All-Weather-Protection-Touchscreen-Anti-Fatigue/dp/B0FH76HCHQ/'
    },
    {
        id: 'amz_armsleeves',
        name: 'Boldfit Arm Sleeves',
        category: 'accessories',
        price: 199,
        imageUrl: require('../assets/Shop/Arm sleves.webp'),
        url: 'https://www.amazon.in/Boldfit-Sleeves-Protection-Running-Riding/dp/B0CNKNMSBL/'
    },
    {
        id: 'amz_holder',
        name: 'Portronics Mobile Holder',
        category: 'accessories',
        price: 299,
        imageUrl: require('../assets/Shop/Mobile holder.webp'),
        url: 'https://www.amazon.in/Portronics-Rotational-Bicycle-Motorcycle-Compatible/dp/B0CNYNX7LF/'
    },
    {
        id: 'amz_brush',
        name: 'AllExtreme Chain Cleaner Brush',
        category: 'tools',
        price: 149,
        imageUrl: require('../assets/Shop/Chain cleaner.webp'),
        url: 'https://www.amazon.in/AllExtreme-%E2%80%8ECYL-06-T-Multi-Purpose-Bristles-Motorcycles/dp/B076DC73XF/'
    },
    {
        id: 'amz_goggles',
        name: 'SARTE Riding Goggles',
        category: 'helmets',
        price: 485,
        imageUrl: require('../assets/Shop/Riding goggles.webp'),
        url: 'https://www.amazon.in/SARTE-Motorcycle-Goggles-Anti-Scratch-Motorcross/dp/B0CFB3SBP3/'
    },
    {
        id: 'amz_cleaner',
        name: 'ShineXPro Helmet Cleaner',
        category: 'tools',
        price: 265,
        imageUrl: require('../assets/Shop/Helmet cleaner.webp'),
        url: 'https://www.amazon.in/ShineXPro-Cleaner-Microfiber-Anti-Bacterial-Cleaning/dp/B0FCS7NW5K/'
    },
    {
        id: 'amz_tailbag',
        name: 'Axor Tail Bag (40L)',
        category: 'luggage',
        price: 6200,
        imageUrl: require('../assets/Shop/Tail bag.webp'),
        url: 'https://www.amazon.in/Axor-Tail-Bag-40-LTS/dp/B098DYHDXD/'
    },
    {
        id: 'amz_chainlock',
        name: 'Gadget Deals Chain Lock',
        category: 'tools',
        price: 249,
        imageUrl: require('../assets/Shop/Chain lock.webp'),
        url: 'https://www.amazon.in/Gadget-Deals-Bicycle-Number-Password/dp/B0FV84WXRJ/'
    },
    {
        id: 'amz_cammount',
        name: 'CELLMASTER Camera Mount',
        category: 'tools',
        price: 270,
        imageUrl: require('../assets/Shop/helmet camera mount.webp'),
        url: 'https://www.amazon.in/CELLMASTER-Helmet-Camera-Mobile-Accessories/dp/B0D3Z8H4KS/'
    },
    {
        id: 'amz_tvshelmet',
        name: 'TVS Lightweight Helmet',
        category: 'helmets',
        price: 923,
        imageUrl: require('../assets/Shop/Tvs helmet.webp'),
        url: 'https://www.amazon.in/TVS-Motorcycle-Certified-Lightweight-Resistant-Ventilated-Quick-Release/dp/B0F1MMRK8S/'
    },
    {
        id: 'amz_sbh57',
        name: 'Steelbird SBH-57 Carbon',
        category: 'helmets',
        price: 2999,
        imageUrl: require('../assets/Shop/Steelbird helmet.webp'),
        url: 'https://www.amazon.in/Steelbird-SBH-57-Carbon-Fighter-Certified/dp/B0DFT5B7PL/'
    },
    {
        id: 'amz_sba21',
        name: 'Steelbird SBA-21 Genie',
        category: 'helmets',
        price: 1793,
        imageUrl: require('../assets/Shop/Steelbird SBA-21 helmet.webp'),
        url: 'https://www.amazon.in/Steelbird-SBA-21-Genie-Certified-Graphic/dp/B0D2QMRXNZ/'
    },
    {
        id: 'amz_headfox',
        name: 'HEADFOX Bluetooth Helmet',
        category: 'helmets',
        price: 3300,
        imageUrl: require('../assets/Shop/Headfox helmet.webp'),
        url: 'https://www.amazon.in/HEADFOX-Bluetooth-Helmet-Waterproof-Certified/dp/B0F7LVTZF7/'
    },
    {
        id: 'amz_badowl',
        name: 'BADOWL Riding Gloves',
        category: 'gloves',
        price: 499,
        imageUrl: require('../assets/Shop/Badowl gloves.webp'),
        url: 'https://www.amazon.in/BADOWL-Motorcycle-Touchscreen-Fingertips-Protection/dp/B0DLGL8JVL/'
    },
    {
        id: 'amz_probiker',
        name: 'Probiker Synthetic Gloves',
        category: 'gloves',
        price: 299,
        imageUrl: require('../assets/Shop/Probiker gloves.webp'),
        url: 'https://www.amazon.in/Probiker-Synthetic-Leather-Motorcycle-Gloves/dp/B00QESWIUC/'
    },
    {
        id: 'amz_tvsxplorer',
        name: 'TVS Racing Xplorer Neon',
        category: 'gloves',
        price: 3499,
        imageUrl: require('../assets/Shop/TVS explore gloves.webp'),
        url: 'https://www.amazon.in/TVS-Racing-Riding-Gloves-Neon/dp/B0BQ6S88F2/'
    },
    {
        id: 'amz_tvsmesh',
        name: 'TVS Mesh Riding Gloves',
        category: 'gloves',
        price: 1299,
        imageUrl: require('../assets/Shop/TVS mesh gloves.webp'),
        url: 'https://www.amazon.in/TVS-Ventilation-Compatible-Fingertips-Knuckles-Premium/dp/B098XSBXZS/'
    },
    {
        id: 'amz_allextreme_jacket',
        name: 'AllExtreme Riding Jacket',
        category: 'jackets',
        price: 2999,
        imageUrl: require('../assets/Shop/Allextreme jacket.jpg'),
        url: 'https://www.amazon.in/gp/aw/d/B0C3MJV637/'
    },
    {
        id: 'amz_boldfit_jacket',
        name: 'Boldfit Windcheater',
        category: 'jackets',
        price: 699,
        imageUrl: require('../assets/Shop/Boldfit jacket.webp'),
        url: 'https://www.amazon.in/Boldfit-Windcheater-Lightweight-Wind-Resistant-Fit-Stylish/dp/B0GCZY4PPY/'
    },
    {
        id: 'amz_axor_jacket',
        name: 'Axor Cruise Jacket',
        category: 'jackets',
        price: 5200,
        imageUrl: require('../assets/Shop/Axor jacket.webp'),
        url: 'https://www.amazon.in/Axor-Cruise-Jacket-Black-Red-XL/dp/B09T3D76GV/'
    },
    {
        id: 'amz_rynox_jacket',
        name: 'Rynox Air Jacket',
        category: 'jackets',
        price: 6450,
        imageUrl: require('../assets/Shop/Rynox jacket.webp'),
        url: 'https://www.amazon.in/Rynox-Air-Jacket-Motorcycle-Protection/dp/B0FCXVVZBK/'
    },
    {
        id: 'amz_re_jacket',
        name: 'Royal Enfield Streetwind V3',
        category: 'jackets',
        price: 4570,
        imageUrl: require('../assets/Shop/Royal enfield jacket.webp'),
        url: 'https://www.amazon.in/Royal-Enfield-STREETWIND-V3-BLACK/dp/B0CHMDWJHL/'
    },
    {
        id: 'amz_nikavi_jacket',
        name: 'NIKAVI Riders Jacket',
        category: 'jackets',
        price: 3820,
        imageUrl: require('../assets/Shop/Nikavi jacket.webp'),
        url: 'https://www.amazon.in/NIKAVI-Protective-Riders-Jacket-Motorcycle/dp/B09KNT1GKY/'
    },
    {
        id: 'amz_clan_boot',
        name: 'CLAN Waterproof Shoes',
        category: 'boots',
        price: 5799,
        imageUrl: require('../assets/Shop/clan scout boot.webp'),
        url: 'https://www.amazon.in/CLAN-SHOES-Waterproof-Motorcycle-Footwear/dp/B0DM95GQGR/'
    },
    {
        id: 'amz_tvs_boot',
        name: 'TVS Racing Ankle Boots',
        category: 'boots',
        price: 5999,
        imageUrl: require('../assets/Shop/TVS boot.webp'),
        url: 'https://www.amazon.in/TVS-Racing-Ankle-Length-Riding/dp/B0CRYZWBY1/'
    },
    {
        id: 'amz_bacca_boot',
        name: 'Bacca Bucci 7-Eye Boots',
        category: 'boots',
        price: 1820,
        imageUrl: require('../assets/Shop/Bacca boots.webp'),
        url: 'https://www.amazon.in/Bacca-Bucci-7-Eye-Boots-Inspired/dp/B0BJ7JP4NJ/'
    },
    {
        id: 'amz_cramster_boot',
        name: 'Cramster Flux Boots',
        category: 'boots',
        price: 5999,
        imageUrl: require('../assets/Shop/Cramster boot.webp'),
        url: 'https://www.amazon.in/Cramster-Motorcycle-Protection-Resistance-Lightweight/dp/B0FNN9S22W/'
    },
    {
        id: 'amz_eego_boot',
        name: 'Eego Italy Rider-1 Boots',
        category: 'boots',
        price: 1949,
        imageUrl: require('../assets/Shop/eego boots.webp'),
        url: 'https://www.amazon.in/Eego-Italy-Pro-Ridding-Gear-RIDER-1-BLACK-8/dp/B09KM85PY7/'
    },
    {
        id: 'amz_vr1_boot',
        name: 'VR1 B05 Red Boots',
        category: 'boots',
        price: 9499,
        imageUrl: require('../assets/Shop/VR1 boot.webp'),
        url: 'https://www.amazon.in/VR1-B05-Red-Boots-Mens/dp/B0CX1KMZ3C/'
    },
    {
        id: 'amz_feya_intercom',
        name: 'FEYA Helmet Headset',
        category: 'electronics',
        price: 1499,
        imageUrl: require('../assets/Shop/Helmet speakers.webp'),
        url: 'https://www.amazon.in/FEYA-Motorcycle-Motorbike-Reduction-Accessories/dp/B0F488SZ3M/'
    },
    {
        id: 'amz_ajjas_gps',
        name: 'Ajjas 4G Lite GPS',
        category: 'electronics',
        price: 1429,
        imageUrl: require('../assets/Shop/Ajjas 4g gps.webp'),
        url: 'https://www.amazon.in/Ajjas-4G-Lite-Remote-Engine/dp/B0DC6PQMV1/'
    },
    {
        id: 'amz_sheeba_polish',
        name: 'Sheeba Liquid Polish',
        category: 'tools',
        price: 90,
        imageUrl: require('../assets/Shop/Sheeba polish.webp'),
        url: 'https://www.amazon.in/Sheeba-SCAIO07-Multipurpose-Liquid-Polish/dp/B00TC5I66Y/'
    },
    {
        id: 'amz_usb_charger',
        name: 'Thlevel USB-C Fast Charger',
        category: 'electronics',
        price: 799,
        imageUrl: require('../assets/Shop/Usb charger.webp'),
        url: 'https://www.amazon.in/Thlevel-Motorcycle-Charger-Type-C-Waterproof/dp/B0D12N1VNH/'
    },
    {
        id: 'amz_elbow_guard',
        name: 'Autofy Knee & Elbow Protector',
        category: 'guards',
        price: 499,
        imageUrl: require('../assets/Shop/elbow gurad.webp'),
        url: 'https://www.amazon.in/Autofy-Protector-Bikers-Riders-Motorcycle/dp/B08W1VKCLZ/'
    },
    {
        id: 'amz_flash_torch',
        name: 'Portronics Rechargeable Torch',
        category: 'lights',
        price: 383,
        imageUrl: require('../assets/Shop/flash torch.webp'),
        url: 'https://www.amazon.in/Portronics-Rechargeable-Flashlight-Adjustable-Emergencies/dp/B0FDWWNT31/'
    },
    {
        id: 'amz_screw_driver',
        name: 'Portronics Magnetic Screwdriver',
        category: 'tools',
        price: 335,
        imageUrl: require('../assets/Shop/screw driver.webp'),
        url: 'https://www.amazon.in/Portronics-Screwdriver-Travel-Friendly-Magnetic-Household/dp/B0DWLB93BG/'
    },
    {
        id: 'amz_toolkit',
        name: 'CLAPONE Professional Toolkit',
        category: 'tools',
        price: 249,
        imageUrl: require('../assets/Shop/toolkit.webp'),
        url: 'https://www.amazon.in/CLAPONE-Tool-Kit-Screwdriver-Motorcycle/dp/B0G3L97LBT/'
    },
    {
        id: 'amz_uv_torch',
        name: 'LETION UV Detection Torch',
        category: 'lights',
        price: 599,
        imageUrl: require('../assets/Shop/uv torch.webp'),
        url: 'https://www.amazon.in/LETION-Flashlight-Highlight-Waterproof-Detection/dp/B07X1H5TJQ/'
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
            const items = await ShopService.getProducts(activeCategory, searchQuery);
            setProducts(items);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Optimization: Run database sync only ONCE on mount, not on every fetch/category switch
    useEffect(() => {
        const syncDatabase = async () => {
            try {
                const currentItems = await ShopService.getProducts('all');
                const initIds = INITIAL_PRODUCTS.map(p => p.id);
                const hasOldItems = currentItems.some(i => !initIds.includes(i.id));
                const isMissingItems = currentItems.length !== INITIAL_PRODUCTS.length;

                if (currentItems.length === 0 || hasOldItems || isMissingItems) {
                    await ShopService.clearOldProducts(initIds);
                    await ShopService.seedProducts(INITIAL_PRODUCTS);
                    fetchProducts(); // Refresh list after sync
                }
            } catch (error) {
                console.error("Sync error:", error);
            }
        };
        syncDatabase();
    }, []);

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
                    onPress={() => navigation.navigate('Wishlist')}
                >
                    <Ionicons name="heart-outline" size={26} color="#FFD700" />
                    {wishlist.length > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{wishlist.length}</Text>
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
                    onPress={() => {
                        if (item.url) {
                            Linking.openURL(item.url as string);
                        } else {
                            navigation.navigate('ProductDetails', { product: item });
                        }
                    }}
                >
                    <Image
                        source={typeof item.imageUrl === 'number' ? item.imageUrl : { uri: item.imageUrl as string }}
                        style={styles.productImage}
                    />
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
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
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
