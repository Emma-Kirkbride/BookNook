import { Dimensions, StyleSheet } from 'react-native';
import { typography } from './Typography';

const { width, height } = Dimensions.get('window');

// Soft Blue Color Palette
const colors = {
  // Background Colors
  background: {
    primary: '#E6F2FF',       
    secondary: '#FFFFFF',      
    tertiary: '#F0F7FF',       
  },

  // Soft Text Colors (blue-gray tones)
  text: {
    primary: '#1A365D',
    textTitle:'#1A365D',        
    secondary: '#4A5568',      
    tertiary: '#718096',     
    muted: '#A0AEC0',        
    inverse: '#FFFFFF',        
    accent: '#4299E1',         
  },

  // Soft Button Colors
  primary: {
    main: '#4299E1',         
    hover: '#3182CE',        
    light: '#90CDF4',         
    background: '#EBF8FF',    
  },

  // Semantic Colors (softer versions)
  semantic: {
    success: '#68D391',     
    warning: '#F6AD55',     
    error: '#E53E3E',         
  },

  // Soft Neutral Grays
  neutral: {
    100: '#F7FAFC',          
    200: '#EDF2F7',          
    300: '#E2E8F0',         
    400: '#CBD5E0',        
    500: '#A0AEC0',         
    600: '#718096',       
  },

  // Borders & Shadows
  border: {
    light: '#F2EEF2',        
    medium: '#E2E8F0',        
    focus: '#90CDF4',       
  },

  shadow: {
    light: 'rgba(66, 153, 225, 0.08)',  
    medium: 'rgba(66, 153, 225, 0.12)',  
  },
};

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
  flexDirection: 'row',      
  alignItems: 'center',       
  justifyContent: 'center',    
  marginBottom: 8,
  gap: 12, 
  },
  logoIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    tintColor: '#1A365D' ,
  },
  appName: {
    ...typography.h1,
    color: colors.text.primary, 
    letterSpacing: -0.8,
  },
  tagline: {
    ...typography.body,
    color: colors.text.secondary, 
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formContainer: {
    flex: 1,
  },
  formCard: {
    backgroundColor: colors.background.secondary, 
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginHorizontal: 8,
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  formHeader: {
    marginBottom: 32, 
    alignItems: 'center',
  },
  formTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
      marginBottom: 24,
      paddingHorizontal: 0,
  },
  inputLabel: {
    ...typography.overline,
    color: colors.text.secondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral[400],
    backgroundColor: 'transparent',
  },
  inputFocused: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.main,
},
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[400],
  },
  passwordInput: {
    ...typography.body,
    flex: 1,
    color: colors.text.primary,
    paddingVertical: 12,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    width: 16,
    height: 16,
    tintColor: colors.text.secondary, 
  },
  authButton: {
    backgroundColor: colors.primary.main, 
    paddingVertical: 16,
    borderRadius: 25, 
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  authButtonDisabled: {
    backgroundColor: colors.neutral[300], 
    shadowOpacity: 0,
    elevation: 0,
  },
  authButtonText: {
    ...typography.button,
    color: colors.text.inverse, 
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingSpinner: {
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.medium, 
  },
  dividerText: {
    ...typography.caption,
    marginHorizontal: 16,
    color: colors.text.muted, 
    fontWeight: '500',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchButtonText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  switchButtonHighlight: {
    color: colors.text.accent, 
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.semantic.success, 
    fontWeight: '500',
    marginBottom: 4,
  },
  footerSubText: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  forgotPasswordButton: {
  alignSelf: 'flex-end',
  marginTop: 8,
  marginBottom: 4,
},
forgotPasswordText: {
  fontSize: 14,
  color: '#4299E1',
  fontWeight: '600',
},
inputWrapperFocused: {
  shadowColor: '#4299E1',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 4,
},
inputWrapperError: {
  borderColor: '#EF4444',
},
helperText: {
  ...typography.caption,
  color: colors.semantic.error,
  marginTop: 4,
  fontSize: 12,
},
});

export default loginStyles;