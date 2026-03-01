import { db } from '../config/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    getDoc,
    increment,
    orderBy
} from 'firebase/firestore';

export const ShopService = {
    // Product Methods
    getProducts: async (category = 'all', searchQuery = '') => {
        try {
            const productsRef = collection(db, 'products');
            let q;

            if (category !== 'all') {
                q = query(productsRef, where('category', '==', category));
            } else {
                q = query(productsRef, orderBy('name'));
            }

            const snapshot = await getDocs(q);
            let products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                products = products.filter(p => {
                    const nameMatch = p.name ? p.name.toLowerCase().includes(lowerQuery) : false;
                    const descMatch = p.description ? p.description.toLowerCase().includes(lowerQuery) : false;
                    return nameMatch || descMatch;
                });
            }

            return products;
        } catch (error) {
            console.error("Error fetching products:", error);
            throw error;
        }
    },

    // Cart Methods
    subscribeToCart: (userId, onUpdate) => {
        const cartRef = collection(db, 'users', userId, 'cart');
        return onSnapshot(cartRef, (snapshot) => {
            const cartItems = snapshot.docs.map(doc => ({
                productId: doc.id,
                ...doc.data()
            }));
            onUpdate(cartItems);
        }, (error) => {
            console.error("Error subscribing to cart:", error);
        });
    },

    addToCart: async (userId, product, quantity = 1) => {
        try {
            const cartItemRef = doc(db, 'users', userId, 'cart', product.id);
            const cartItemSnap = await getDoc(cartItemRef);

            if (cartItemSnap.exists()) {
                // Check stock
                const currentQty = cartItemSnap.data().quantity;
                if (currentQty + quantity > product.stock) {
                    throw new Error("Insufficient stock");
                }
                await updateDoc(cartItemRef, {
                    quantity: increment(quantity)
                });
            } else {
                if (quantity > product.stock) {
                    throw new Error("Insufficient stock");
                }
                await setDoc(cartItemRef, {
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    quantity: quantity
                });
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
            throw error;
        }
    },

    removeFromCart: async (userId, productId) => {
        try {
            const cartItemRef = doc(db, 'users', userId, 'cart', productId);
            await deleteDoc(cartItemRef);
        } catch (error) {
            console.error("Error removing from cart:", error);
            throw error;
        }
    },

    updateCartQuantity: async (userId, productId, newQuantity) => {
        try {
            const cartItemRef = doc(db, 'users', userId, 'cart', productId);
            if (newQuantity <= 0) {
                await deleteDoc(cartItemRef);
            } else {
                await updateDoc(cartItemRef, {
                    quantity: newQuantity
                });
            }
        } catch (error) {
            console.error("Error updating cart quantity:", error);
            throw error;
        }
    },

    // Wishlist Methods
    subscribeToWishlist: (userId, onUpdate) => {
        const wishlistRef = collection(db, 'users', userId, 'wishlist');
        return onSnapshot(wishlistRef, (snapshot) => {
            const wishlistItems = snapshot.docs.map(doc => doc.id);
            onUpdate(wishlistItems);
        }, (error) => {
            console.error("Error subscribing to wishlist:", error);
        });
    },

    toggleWishlist: async (userId, product) => {
        try {
            const wishlistItemRef = doc(db, 'users', userId, 'wishlist', product.id);
            const wishlistItemSnap = await getDoc(wishlistItemRef);

            if (wishlistItemSnap.exists()) {
                await deleteDoc(wishlistItemRef);
                return false; // Removed
            } else {
                await setDoc(wishlistItemRef, {
                    productId: product.id,
                    addedAt: new Date()
                });
                return true; // Added
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
            throw error;
        }
    },

    // Seeding products (For development/initial setup)
    seedProducts: async (products) => {
        try {
            const productsRef = collection(db, 'products');
            for (const product of products) {
                await setDoc(doc(productsRef, product.id), product);
            }
            console.log("Products seeded successfully");
        } catch (error) {
            console.error("Error seeding products:", error);
        }
    }
};
