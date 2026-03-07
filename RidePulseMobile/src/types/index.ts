// ─── Core Shared Types ───────────────────────────────────────────────────────

export interface UserProfile {
    profileCompleted?: boolean;
    riderId?: string;
    role?: string;
    fullName?: string;
    licenseNumber?: string;
    vehicleNumber?: string;
    vehicleName?: string;
    vehicleModel?: string;
    profileImage?: string;
    age?: string | number;
    dob?: string;
}

export interface AppUser {
    id: string;
    email: string;
    name: string;
    profile: UserProfile;
    createdAt?: string;
    groupId?: string;
    profileImage?: string;
    vehicle?: string;
    skipProfileSetup?: boolean;
    profileCompleted?: boolean;
    [key: string]: unknown;
}

// ─── Auth Context ─────────────────────────────────────────────────────────────

export interface AuthResult {
    success: boolean;
    error?: string;
    isNewUser?: boolean;
    result?: unknown;
}

export interface AuthContextValue {
    user: AppUser | null;
    setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
    loading: boolean;
    login: (email: string, password: string) => Promise<AuthResult>;
    register: (email: string, password: string) => Promise<AuthResult>;
    loginWithPhone: (phoneNumber: string, appVerifier: unknown) => Promise<AuthResult>;
    /** Pass idToken (preferred) or accessToken (fallback) from Google OAuth */
    loginWithGoogleCredential: (idToken: string | null, accessToken?: string | null) => Promise<AuthResult>;
    loginAnonymously: () => Promise<AuthResult>;
    logout: () => Promise<void>;
    updateProfileStatus: (data: Record<string, unknown>) => Promise<AuthResult>;
}

// ─── Theme Context ────────────────────────────────────────────────────────────

export interface ThemeContextValue {
    colorScheme: 'light' | 'dark' | undefined;
    toggleColorScheme: () => void;
}

// ─── Bike / Vehicle Data ──────────────────────────────────────────────────────

export interface BikeModel {
    id: string;
    name: string;
    hp: number;
    torque: number;
    weight: number;
    image: string;
}

export interface BikeBrand {
    models: BikeModel[];
}

export type BikeDatabase = Record<string, BikeBrand>;

// ─── Ride / Group ─────────────────────────────────────────────────────────────

export interface RideMember {
    id: string;
    name: string;
    profileImage?: string | null;
    vehicle?: string | null;
    isOnline?: boolean;
    role?: 'host' | 'member' | string;
    joinedAt?: unknown;
    latitude?: number;
    longitude?: number;
    active?: boolean;
}

/** Member within an active group ride */
export interface GroupMember {
    id: string;
    name: string;
    username?: string;
    profileImage?: string | null;
    vehicle?: string | null;
    isOnline: boolean;
    role: 'host' | 'member' | string;
    latitude?: number;
    longitude?: number;
    speed?: number;
    heading?: number;
    color?: string;
    timestamp?: unknown;
}

export interface GroupSOSAlert {
    id: string;
    triggeredBy: string;
    username: string;
    latitude: number;
    longitude: number;
    timestamp: unknown;
    status: 'active' | 'resolved';
}

/** Group / lobby data from Firestore */
export interface GroupData {
    id: string;
    hostId: string;
    hostName?: string;
    name?: string;
    rideName?: string;
    startLocation?: string;
    destination?: string;
    destinationCoords?: Coordinate;
    routeCoords?: Coordinate[];
    rideType?: string;
    createdAt?: unknown;
    status: 'waiting' | 'active' | 'completed' | 'cancelled' | string;
    members?: GroupMember[];
    lastMessage?: {
        senderId: string;
        senderName: string;
        text: string;
    };
    [key: string]: unknown;
}

export interface RideGroup {
    id: string;
    hostId: string;
    hostName: string;
    rideName: string;
    startLocation: string;
    destination: string;
    destinationCoords?: Coordinate;
    routeCoords?: Coordinate[];
    rideType: string;
    createdAt?: unknown;
    status: 'waiting' | 'active' | 'completed' | 'cancelled' | string;
    members?: RideMember[];
    lastMessage?: {
        senderId: string;
        senderName: string;
        text: string;
    };
}

export interface RideDetails {
    name?: string;
    startLocation?: string;
    destination?: string;
    destinationCoords?: Coordinate;
    routeCoords?: Coordinate[];
    rideType?: string;
}

// ─── Maps / Location ──────────────────────────────────────────────────────────

export interface Coordinate {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    altitude?: number;
    accuracy?: number;
}

/** Alias used across screens for location coordinates */
export type LocationCoords = Coordinate;

export interface GeocodeResult {
    latitude: number;
    longitude: number;
    displayName: string;
}

export interface ReverseGeocodeResult {
    fullAddress: string;
    shortAddress: string;
    details: Record<string, string>;
}

export interface PlaceResult {
    id: string;
    name: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
}

export interface PlaceSuggestion {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    description?: string;
}

export interface RouteStep {
    instruction: string;
    name: string;
    distance: number;
    duration: number;
    maneuver: number;
}

export interface RouteResult {
    coordinates: Coordinate[];
    distance: number;
    duration: number;
    steps: RouteStep[];
}

// ─── Shop / Cart ──────────────────────────────────────────────────────────────

export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    category?: string;
    stock?: number;
    rating?: number;
    reviewCount?: number;
    [key: string]: unknown;
}

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    imageUrl?: string;
    quantity: number;
}

// ─── Stats / Achievements ─────────────────────────────────────────────────────

export interface UserStats {
    totalDistance: number;
    totalRides: number;
    totalDuration: number;
    maxSpeed: number;
    longestRide: number;
    lastRide?: RideData;
    updatedAt?: unknown;
}

export interface RideData {
    id?: string;
    name?: string;
    distance: number;
    duration: number;
    averageSpeed?: number;
    maxSpeed?: number;
    route?: Coordinate[];
    polyline?: Coordinate[];
    startLocation?: Coordinate | null;
    endLocation?: Coordinate | null;
    startName?: string;
    endName?: string;
    startedAt?: string;
    endedAt?: string;
    timestamp?: unknown;
    rideType?: string;
    totalDistance?: number;
    totalTime?: number;
    [key: string]: unknown;
}

export interface Achievement {
    unlockedAt: string;
}

export type AchievementsMap = Record<string, Achievement>;

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
    Login: undefined;
    ProfileSetup: undefined;
    Main: undefined;
    ZoneMode: undefined;
    SmartGarage: undefined;
    RideProgress: undefined;
    Cart: undefined;
    ProductDetails: { product: Product };
    Wishlist: undefined;
    Lobby: undefined;
    Map: {
        startRide?: boolean;
        groupId?: string;
        rideName?: string;
        destination?: string;
        returnTrip?: boolean;
        startCoords?: Coordinate;
        destCoords?: Coordinate;
        startName?: string;
        destName?: string;
    } | undefined;
};

export type MainTabParamList = {
    Map: undefined;
    Stats: undefined;
    CenterLogo: undefined;
    Shop: undefined;
    Settings: undefined;
    Lobby: undefined;
};
