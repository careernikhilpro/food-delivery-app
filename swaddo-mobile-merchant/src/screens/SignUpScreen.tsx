import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
          
          {/* Top Bar */}
          <View className="px-6 pt-12 pb-6 items-center relative">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="absolute left-6 top-12"
            >
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-neutral-900 mt-2">Create Merchant Account</Text>
            <Text className="text-sm text-neutral-500 mt-1">Grow your business with Swaddo</Text>
          </View>

          {/* Form Section */}
          <View className="px-6 mt-4 space-y-4">
            
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-900 mb-2">Business Name</Text>
              <TextInput
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Your Restaurant Name"
                placeholderTextColor="#CBD5E1"
                className="w-full bg-white border border-neutral-300 rounded-xl py-3.5 px-4 text-neutral-900"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-900 mb-2">Contact Name</Text>
              <TextInput
                value={contactName}
                onChangeText={setContactName}
                placeholder="John Doe"
                placeholderTextColor="#CBD5E1"
                className="w-full bg-white border border-neutral-300 rounded-xl py-3.5 px-4 text-neutral-900"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-900 mb-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="merchant@example.com"
                placeholderTextColor="#CBD5E1"
                keyboardType="email-address"
                autoCapitalize="none"
                className="w-full bg-white border border-neutral-300 rounded-xl py-3.5 px-4 text-neutral-900"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-900 mb-2">Phone number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor="#CBD5E1"
                keyboardType="phone-pad"
                className="w-full bg-white border border-neutral-300 rounded-xl py-3.5 px-4 text-neutral-900"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutral-900 mb-2">Password</Text>
              <View className="relative justify-center">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••••••"
                  placeholderTextColor="#CBD5E1"
                  secureTextEntry={!showPassword}
                  className="w-full bg-white border border-neutral-300 rounded-xl py-3.5 pl-4 pr-12 text-neutral-900 tracking-widest"
                />
                <TouchableOpacity 
                  className="absolute right-4" 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Checkbox */}
            <View className="flex-row items-center mb-6 mt-2">
              <TouchableOpacity onPress={() => setAgree(!agree)} className="mr-3">
                <Ionicons 
                  name={agree ? "checkbox" : "square-outline"} 
                  size={24} 
                  color={agree ? "#16A34A" : "#CBD5E1"} 
                />
              </TouchableOpacity>
              <Text className="text-sm text-neutral-500 flex-1">
                I agree to the <Text className="text-primary font-medium">Terms & Conditions</Text>
              </Text>
            </View>

            <TouchableOpacity 
              className="w-full bg-primary rounded-xl py-4 items-center justify-center shadow-sm"
              onPress={() => navigation.navigate('VerifyOTP')}
            >
              <Text className="text-white font-bold text-base">Sign Up</Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-sm text-neutral-500">Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text className="text-primary font-bold text-sm">Login</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
