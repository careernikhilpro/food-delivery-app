import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-between">
            
            {/* Top Section */}
            <View className="px-6 pt-12 pb-4 flex-row justify-between items-start">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-primary rounded-full items-center justify-center mr-2">
                  <Ionicons name="location-sharp" size={18} color="white" />
                </View>
                <Text className="text-xl font-bold text-primary">Swaddo</Text>
              </View>
              <View className="items-end">
                <Text className="text-xl font-bold text-neutral-900">Welcome</Text>
                <Text className="text-sm text-neutral-500">to merchant account</Text>
              </View>
            </View>

            {/* Form Section */}
            <View className="px-6 z-10">
              <View className="mb-5">
                <Text className="text-sm font-semibold text-neutral-900 mb-2">Email or Phone Number</Text>
                <TextInput
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  placeholder="merchant@example.com"
                  placeholderTextColor="#CBD5E1"
                  className="w-full bg-white border border-neutral-300 rounded-xl py-4 px-4 text-neutral-900"
                  autoCapitalize="none"
                />
              </View>

              <View className="mb-2">
                <Text className="text-sm font-semibold text-neutral-900 mb-2">Password</Text>
                <View className="relative justify-center">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••••••"
                    placeholderTextColor="#CBD5E1"
                    secureTextEntry={!showPassword}
                    className="w-full bg-white border border-neutral-300 rounded-xl py-4 pl-4 pr-12 text-neutral-900 tracking-widest"
                  />
                  <TouchableOpacity 
                    className="absolute right-4" 
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  className="self-end mt-2"
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text className="text-sm font-medium text-primary">Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                className="w-full bg-primary rounded-xl py-4 items-center justify-center mt-4 shadow-sm"
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Text className="text-white font-bold text-base">Login</Text>
              </TouchableOpacity>

              <View className="flex-row justify-center mt-6">
                <Text className="text-sm text-neutral-500">Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                  <Text className="text-primary font-bold text-sm">Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Illustration Space */}
            <View className="h-48 w-full mt-10 items-center justify-end relative">
               <View className="absolute bottom-0 w-full h-12 bg-neutral-100 rounded-t-full scale-x-150" />
               <View className="w-16 h-16 bg-primary rounded-xl border-2 border-white items-center justify-center mb-6 shadow-sm relative">
                  <Ionicons name="bicycle" size={32} color="white" />
               </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
