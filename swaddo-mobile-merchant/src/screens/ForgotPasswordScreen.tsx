import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [emailOrPhone, setEmailOrPhone] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1">
            
            {/* Top Bar */}
            <View className="px-6 pt-12 pb-6 relative">
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="mb-8"
              >
                <Ionicons name="arrow-back" size={24} color="#0F172A" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-neutral-900 mt-2">Forgot Password?</Text>
              <Text className="text-sm text-neutral-500 mt-2 leading-5">
                Enter your email or phone number we'll send you a verification code
              </Text>
            </View>

            {/* Form Section */}
            <View className="px-6 flex-1 flex-col">
              <View className="mb-4">
                <Text className="text-sm font-semibold text-neutral-900 mb-2">Email or Phone Number</Text>
                <TextInput
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  placeholder="merchant@example.com"
                  placeholderTextColor="#CBD5E1"
                  autoCapitalize="none"
                  className="w-full bg-white border border-neutral-300 rounded-xl py-4 px-4 text-neutral-900"
                />
              </View>

              {/* Illustration Space */}
              <View className="flex-1 items-center justify-center py-10 relative">
                <View className="w-32 h-32 bg-primary/10 rounded-full absolute bottom-4 opacity-70" style={{ transform: [{ scale: 1.5 }] }} />
                
                {/* Shop Graphic Placeholder */}
                <View className="w-32 h-24 bg-white border-2 border-primary rounded-t-xl z-10 flex-col overflow-hidden items-center justify-end">
                   {/* Awning */}
                   <View className="absolute top-0 w-full h-8 bg-primary flex-row justify-around rounded-b-md shadow-sm">
                      <View className="w-4 h-full bg-white/30 skew-x-12" />
                      <View className="w-4 h-full bg-white/30 skew-x-12" />
                      <View className="w-4 h-full bg-white/30 skew-x-12" />
                   </View>
                   <Ionicons name="storefront-outline" size={40} color="#16A34A" style={{ opacity: 0.5, marginBottom: 8 }} />
                </View>
                {/* Little scooter prop */}
                <View className="absolute bottom-4 left-10 w-10 h-10 bg-primary rounded-lg z-20 items-center justify-center border border-white">
                  <Ionicons name="bicycle" size={20} color="white" />
                </View>
              </View>

              {/* Bottom Button */}
              <View className="pb-8 justify-end">
                <TouchableOpacity 
                  className="w-full bg-primary rounded-xl py-4 items-center justify-center shadow-sm"
                  onPress={() => navigation.navigate('VerifyOTP')}
                >
                  <Text className="text-white font-bold text-base">Continue</Text>
                </TouchableOpacity>
              </View>

            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
