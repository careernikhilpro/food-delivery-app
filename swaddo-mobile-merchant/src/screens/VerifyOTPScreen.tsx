import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyOTPScreen() {
  const navigation = useNavigation<any>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

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
              <Text className="text-2xl font-bold text-neutral-900 mt-2">Verify OTP</Text>
              <Text className="text-sm text-neutral-500 mt-2 leading-5">
                Enter the 6-digit code sent to{'\n'}
                <Text className="text-primary font-bold">+91 98765 43210</Text>
              </Text>
            </View>

            {/* Form Section */}
            <View className="px-6 flex-1 flex-col">
              
              <View className="flex-row justify-between mt-4 mb-6">
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    value={digit}
                    onChangeText={(text) => handleChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    className="w-12 h-14 bg-white border border-neutral-300 rounded-xl text-center text-xl font-bold text-neutral-900 focus:border-primary"
                  />
                ))}
              </View>

              <View className="items-center mb-4">
                <Text className="text-sm text-neutral-500">
                  Resend OTP in <Text className="font-bold text-neutral-900">{timer > 9 ? `00:${timer}` : `00:0${timer}`}</Text>
                </Text>
              </View>

              {/* Illustration Space */}
              <View className="flex-1 items-center justify-center py-10 relative">
                <View className="w-40 h-40 bg-primary/10 rounded-full absolute blur-2xl opacity-60" style={{ transform: [{ scale: 1.5 }] }} />
                
                {/* Mobile Graphic Placeholder */}
                <View className="w-20 h-36 bg-white border-2 border-primary/20 rounded-2xl z-10 flex-col items-center justify-center shadow-md relative">
                   <Ionicons name="phone-portrait-outline" size={80} color="#16A34A" style={{ opacity: 0.1, position: 'absolute' }} />
                   
                   <View className="absolute -right-4 -bottom-2 w-12 h-12 bg-primary rounded-full items-center justify-center shadow-lg z-20">
                     <Ionicons name="shield-checkmark" size={24} color="white" />
                   </View>
                   
                   <View className="absolute -left-6 top-8 w-12 h-10 bg-white border border-neutral-100 rounded-lg items-center justify-center shadow-sm z-20">
                     <Ionicons name="mail" size={20} color="#16A34A" />
                   </View>
                </View>
              </View>

              {/* Bottom Button */}
              <View className="pb-8 justify-end mt-4">
                <TouchableOpacity 
                  className={`w-full rounded-xl py-4 items-center justify-center shadow-sm ${otp.join('').length < 6 ? 'bg-primary/50' : 'bg-primary'}`}
                  disabled={otp.join('').length < 6}
                  onPress={() => navigation.navigate('Dashboard')}
                >
                  <Text className="text-white font-bold text-base">Verify</Text>
                </TouchableOpacity>
              </View>

            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
