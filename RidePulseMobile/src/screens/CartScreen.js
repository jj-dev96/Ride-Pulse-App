import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { ShopService } from '../services/ShopService';

const CartScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const insets = useSafeAreaInsets();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        const unsub = ShopService.subscribeToCart(user.id, (items) => {
            setCartItems(items || []);
            setLoading(false);
        });

        return () => unsub();
    }, [user?.id]);

    const calculateTotal = () => {
        return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    };

    const handleUpdateQuantity = async (productId, newQty) => {
        if (!user?.id) return;
        try {
            await ShopService.updateCartQuantity(user.id, productId, newQty);
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    const handleRemoveItem = (productId) => {
        Alert.alert(
            "Remove Item",
            "Are you sure you want to remove this item from your garage?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => ShopService.removeFromCart(user.id, productId)
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.cartItem}>
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price.toLocaleString()}</Text>

                <View style={styles.quantityRow}>
                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                    >
                        <Ionicons name="remove" size={16} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                    >
                        <Ionicons name="add" size={16} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveItem(item.productId)}
            >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="cart-outline" size={80} color="#374151" />
            </View>
            <Text style={styles.emptyTitle}>YOUR CART IS EMPTY</Text>
            <Text style={styles.emptySubtitle}>Your riding inventory is waiting to be filled.</Text>
            <TouchableOpacity
                style={styles.shopNowBtn}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.shopNowText}>START SHOPPING</Text>
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
                    <Text style={styles.headerTitle}>MY GARAGE CART</Text>
                    <View style={{ width: 40 }} />
                </View>

                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color="#FFD700" />
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={cartItems}
                            renderItem={renderItem}
                            keyExtractor={item => item.productId}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={renderEmpty}
                        />

                        {cartItems.length > 0 && (
                            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                                <View style={styles.priceContainer}>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceLabel}>Subtotal</Text>
                                        <Text style={styles.priceValue}>₹{calculateTotal().toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceLabel}>Shipping</Text>
                                        <Text style={styles.freeText}>FREE</Text>
                                    </View>
                                    <View style={[styles.priceRow, styles.totalRow]}>
                                        <Text style={styles.totalLabel}>Total</Text>
                                        <Text style={styles.totalValue}>₹{calculateTotal().toLocaleString()}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.checkoutBtn}>
                                    <LinearGradient
                                        colors={['#FFD700', '#F59E0B']}
                                        style={styles.checkoutGradient}
                                    >
                                        <Text style={styles.checkoutText}>PROCEED TO CHECKOUT</Text>
                                        <Ionicons name="arrow-forward" size={20} color="black" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
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
    cartItem: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 16, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#374151' },
    itemImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: 'white', resizeMode: 'contain' },
    itemInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    itemName: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    itemPrice: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },

    quantityRow: { flexDirection: 'row', alignItems: 'center' },
    qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
    qtyText: { color: 'white', fontSize: 14, fontWeight: 'bold', marginHorizontal: 15 },
    removeBtn: { padding: 5, justifyContent: 'center' },

    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    emptySubtitle: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
    shopNowBtn: { marginTop: 30, backgroundColor: '#FFD700', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
    shopNowText: { color: 'black', fontWeight: 'bold', fontSize: 14 },

    footer: { backgroundColor: '#161925', padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
    priceContainer: { marginBottom: 20 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    priceLabel: { color: '#9CA3AF', fontSize: 14 },
    priceValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    freeText: { color: '#10B981', fontSize: 14, fontWeight: 'bold' },
    totalRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#374151' },
    totalLabel: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    totalValue: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },

    checkoutBtn: { width: '100%' },
    checkoutGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 10 },
    checkoutText: { color: 'black', fontSize: 16, fontWeight: 'bold' },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});

export default CartScreen;
