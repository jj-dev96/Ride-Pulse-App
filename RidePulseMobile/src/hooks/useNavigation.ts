/**
 * useNavigation.ts
 * Typed navigation hook for the RootStack.
 */
import { useNavigation as useReactNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

const useNavigation = (): RootNavigation => {
    return useReactNavigation<RootNavigation>();
};

export default useNavigation;
