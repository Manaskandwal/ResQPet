import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native';

const { width: SW } = Dimensions.get('window');

// ─── Design Tokens ──────────────────────────────────────────────────────────
export const C = {
  bgMain: '#0e0e0e',
  bgSurface: '#1c1b1b',
  bgElevated: '#242323',
  bgHover: '#2a2a2a',
  brand: '#76d6d5',
  brandDark: '#5cb8b7',
  brandDim: '#76d6d5',
  brandRgb: '118,214,213',
  textMain: '#e5e2e1',
  textMuted: '#879392',
  borderMain: 'rgba(255,255,255,0.06)',
  borderSurface: 'rgba(255,255,255,0.10)',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  white: '#ffffff',
} as const;

// ─── Color Helper Utilities ──────────────────────────────────────────────────
export const statusColor = (status?: string): string => {
  if (!status) return C.textMuted;
  if (['completed', 'resolved_on_spot', 'delivered', 'approved'].includes(status)) return C.success;
  if (['pending', 'hospital_broadcasted', 'ambulance_pinged', 'fundraiser_active'].includes(status)) return C.warning;
  if (['cancelled', 'closed_unresolved', 'rejected'].includes(status)) return C.error;
  return C.brand;
};

export const statusBg = (status?: string): string => {
  const c = statusColor(status);
  return `${c}1A`; // ~10% opacity
};

export const compactDate = (value?: string): string => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Global Stylesheet ────────────────────────────────────────────────────────
export const S = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bgMain,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  shell: { flex: 1, backgroundColor: C.bgMain },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgMain },

  // Splash
  splashTitle: { fontSize: 36, fontWeight: '800', color: C.textMain, marginTop: 16, letterSpacing: -1 },
  splashSub: { fontSize: 15, color: C.textMuted, marginTop: 6 },

  // Brand logo
  brandLogo: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: `${C.brand}30`,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  // Auth
  authContainer: { padding: 24, gap: 24, paddingBottom: 48 },
  authGlow: {
    position: 'absolute', top: -100, left: SW / 2 - 200,
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: C.brand, opacity: 0.04,
  },
  authBrand: { alignItems: 'center', gap: 16, paddingTop: 32 },
  pilotBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: `${C.brand}12`, borderWidth: 1, borderColor: `${C.brand}30`,
    borderRadius: 999,
  },
  pilotDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand },
  pilotText: { fontSize: 11, fontWeight: '700', color: C.brand },
  authTitle: { fontSize: 40, fontWeight: '800', color: C.textMain, letterSpacing: -2 },
  authSubtitle: { fontSize: 15, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  authCard: { backgroundColor: C.bgSurface, borderRadius: 24, padding: 14, gap: 10, borderWidth: 1, borderColor: C.borderSurface },

  // Segments
  segment: { flexDirection: 'row', backgroundColor: C.bgElevated, borderRadius: 12, padding: 4, gap: 4 },
  segItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  segItemActive: { backgroundColor: C.brand },
  segText: { fontSize: 14, fontWeight: '700', color: C.textMuted },
  segTextActive: { color: C.bgMain },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.borderSurface,
  },
  chipActive: { backgroundColor: C.brand, borderColor: C.brand },
  chipText: { fontSize: 13, fontWeight: '700', color: C.textMuted, textTransform: 'capitalize' },
  chipTextActive: { color: C.bgMain },

  // Buttons
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.brand, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    shadowColor: C.brand, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: C.bgMain },
  btnOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'transparent', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18,
    borderWidth: 1.5, borderColor: `${C.brand}60`,
  },
  btnOutlineText: { fontSize: 14, fontWeight: '700', color: C.brand },
  btnDanger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: `${C.error}10`, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18,
    borderWidth: 1, borderColor: `${C.error}30`,
  },
  btnDangerText: { fontSize: 14, fontWeight: '700', color: C.error },
  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.bgElevated, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 20,
    borderWidth: 1, borderColor: C.borderSurface,
  },
  btnGoogleText: { fontSize: 14, fontWeight: '700', color: C.textMain },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.borderMain },
  dividerText: { fontSize: 12, color: C.textMuted, fontWeight: '600' },

  // Form
  formField: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgElevated, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.borderSurface,
    overflow: 'hidden',
  },
  inputWrapFocused: { borderColor: `${C.brand}60` },
  fieldInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, color: C.textMain, fontSize: 15 },
  input: {
    backgroundColor: C.bgElevated, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: C.textMain, fontSize: 14, borderWidth: 1.5, borderColor: C.borderSurface,
  },

  // Header
  appHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: C.bgSurface,
    borderBottomWidth: 1, borderBottomColor: C.borderSurface,
  },
  appHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBrandIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.bgElevated,
    borderWidth: 1, borderColor: `${C.brand}30`,
    alignItems: 'center', justifyContent: 'center',
  },
  appHeaderBrand: { fontSize: 16, fontWeight: '800', color: C.brand, letterSpacing: -0.5 },
  appHeaderRole: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  appHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  impersonatePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: `${C.warning}15`, borderWidth: 1, borderColor: `${C.warning}30`,
  },
  impersonateText: { fontSize: 10, fontWeight: '700', color: C.warning },
  pendingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: `${C.warning}15`, borderWidth: 1, borderColor: `${C.warning}30`,
  },
  pendingDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: C.warning },
  pendingText: { fontSize: 10, fontWeight: '700', color: C.warning },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.borderSurface,
  },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brand, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  headerAvatarText: { fontSize: 14, fontWeight: '800', color: C.bgMain },

  // Tab bar
  tabBarWrapper: {
    paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 20 : 12, paddingTop: 12,
    backgroundColor: C.bgMain,
    borderTopWidth: 1, borderTopColor: C.borderSurface,
  },
  tabBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: C.bgSurface,
    borderWidth: 1, borderColor: C.borderSurface,
    borderRadius: 20, paddingVertical: 10, paddingHorizontal: 8,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  tabItem: { alignItems: 'center', gap: 4, minWidth: 48 },
  tabIconWrap: { width: 42, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapActive: { backgroundColor: C.brand, shadowColor: C.brand, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 },
  tabLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 0.2 },
  tabLabelActive: { color: C.brand },

  // Screen
  screenShell: { flex: 1, backgroundColor: C.bgMain },
  screenContent: { padding: 16, paddingBottom: 24, gap: 16 },
  screenHeader: { gap: 4 },
  screenTitle: { fontSize: 28, fontWeight: '900', color: C.textMain, letterSpacing: -1 },
  screenSubtitle: { fontSize: 14, color: C.textMuted, lineHeight: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 },

  // Hero card
  heroCard: {
    backgroundColor: C.bgSurface, borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: `${C.brand}20`, gap: 10, overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: -60, right: -60, width: 200, height: 200,
    borderRadius: 100, backgroundColor: C.brand, opacity: 0.06,
  },
  heroKicker: { fontSize: 11, fontWeight: '800', color: C.brand, textTransform: 'uppercase', letterSpacing: 1.5 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: C.textMain, letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: C.textMuted, lineHeight: 20 },
  heroActions: { flexDirection: 'row', gap: 12, marginTop: 6 },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: (SW - 42) / 2, backgroundColor: C.bgSurface, borderRadius: 16,
    padding: 16, gap: 8, borderWidth: 1,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: C.textMain, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '600', color: C.textMuted },

  // Surface card
  surfaceCard: {
    backgroundColor: C.bgSurface, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: C.borderSurface, gap: 12,
  },
  cardSectionTitle: { fontSize: 14, fontWeight: '800', color: C.brand, textTransform: 'uppercase', letterSpacing: 1 },

  // List rows
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
  },
  listRowIcon: {
    width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.bgElevated,
  },
  listRowTitle: { fontSize: 14, fontWeight: '700', color: C.textMain },
  listRowSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  // Separator
  separator: { height: 1, backgroundColor: C.borderMain, marginVertical: 4 },

  // Status pill
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statusPillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Notifications
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  notifRowUnread: { backgroundColor: `${C.brand}08`, borderRadius: 12, padding: 10 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.brand, marginTop: 4 },

  // Profile
  profileHeader: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  profileAvatar: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brand, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  profileAvatarText: { fontSize: 32, fontWeight: '800', color: C.bgMain },
  profileName: { fontSize: 22, fontWeight: '800', color: C.textMain, letterSpacing: -0.5 },
  profileEmail: { fontSize: 13, color: C.textMuted },
  roleBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
    backgroundColor: `${C.brand}15`, borderWidth: 1, borderColor: `${C.brand}30`,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: C.brand },

  // Balance card
  balanceCard: {
    backgroundColor: C.bgSurface, borderRadius: 24, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: `${C.brand}25`, overflow: 'hidden', gap: 6,
  },
  balanceGlow: {
    position: 'absolute', top: -50, width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.brand, opacity: 0.05,
  },
  balanceLabel: { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { fontSize: 42, fontWeight: '900', color: C.brand, letterSpacing: -2 },
  balanceSub: { fontSize: 12, color: C.textMuted, fontWeight: '600' },

  // Rescue card
  rescueCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rescueImg: { width: '100%', height: 160, borderRadius: 12, backgroundColor: C.bgElevated },

  // Fundraiser
  fundraiserImg: { width: '100%', height: 140, borderRadius: 12, backgroundColor: C.bgElevated },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: { height: 6, backgroundColor: C.bgElevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.brand, borderRadius: 3 },

  // Map
  mapContainer: { height: 280, borderRadius: 20, overflow: 'hidden', backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.borderSurface },
  webMap: { width: '100%', height: 280 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  mapPlaceholderText: { fontSize: 15, color: C.textMuted, fontWeight: '600' },

  // Actions
  actionGroup: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Segmented Control
  segControl: {
    flexDirection: 'row', backgroundColor: C.bgElevated, borderRadius: 14, padding: 4, gap: 4,
    borderWidth: 1, borderColor: C.borderSurface,
  },
  segControlItem: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  segControlItemActive: { backgroundColor: C.brand },
  segControlText: { fontSize: 13, fontWeight: '700', color: C.textMuted },
  segControlTextActive: { color: C.bgMain },

  // Empty state
  emptyState: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyStateText: { fontSize: 14, color: C.textMuted, fontWeight: '600' },

  // Avatar small
  avatarSmall: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: `${C.brand}20`, alignItems: 'center', justifyContent: 'center',
  },
  avatarSmallText: { fontSize: 16, fontWeight: '800', color: C.brand },

  // New Landing & Modern Onboarding Styles
  landingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.borderMain,
    backgroundColor: C.bgMain,
  },
  landingBrand: {
    fontSize: 18,
    fontWeight: '800',
    color: C.brand,
    letterSpacing: -0.5,
  },
  landingContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 24,
  },
  heroContainer: {
    backgroundColor: C.bgSurface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: C.borderSurface,
    overflow: 'hidden',
    alignItems: 'center',
    gap: 16,
  },
  heroTitleText: {
    fontSize: 32,
    fontWeight: '900',
    color: C.textMain,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 40,
  },
  heroDescText: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  heroActionButtons: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  trustItem: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
  },
  landingSection: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.brand,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  landingSectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textMain,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  landingSectionSub: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  stepsStack: {
    gap: 12,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgSurface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: C.borderSurface,
  },
  stepIcon: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textMain,
  },
  stepDesc: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  statsSection: {
    marginTop: 8,
  },
  statLandingCard: {
    width: '48%',
    backgroundColor: C.bgSurface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.borderSurface,
    alignItems: 'center',
    gap: 4,
  },
  statLandingValue: {
    fontSize: 28,
    fontWeight: '900',
    color: C.brand,
  },
  statLandingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
  },
  roadmapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgSurface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1.5,
  },
  ctaBannerCard: {
    backgroundColor: C.bgSurface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: `${C.brand}30`,
    overflow: 'hidden',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.textMain,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  ctaDesc: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  ctaGlow: {
    position: 'absolute',
    bottom: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: C.brand,
    opacity: 0.05,
  },
  landingFooter: {
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: C.borderMain,
  },
  footerBrandText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.brand,
  },
  footerDivider: {
    fontSize: 10,
    color: C.textMuted,
  },
  pilotBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: `${C.brand}15`,
    borderWidth: 1,
    borderColor: `${C.brand}30`,
  },
  pilotTextSmall: {
    fontSize: 9,
    fontWeight: '800',
    color: C.brand,
    textTransform: 'uppercase',
  },
  btnSignInSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.bgElevated,
    borderWidth: 1,
    borderColor: C.borderSurface,
  },
  btnSignInSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.brand,
  },
  authHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: C.bgElevated,
    borderWidth: 1,
    borderColor: C.borderSurface,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.brand,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  roleCard: {
    backgroundColor: C.bgElevated,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: C.borderSurface,
    gap: 3,
  },
  roleCardActive: {
    backgroundColor: `rgba(${C.brandRgb}, 0.05)`,
    borderColor: C.brand,
    shadowColor: C.brand,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleCardIcon: {
    fontSize: 16,
  },
  roleCardBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: C.textMain,
  },
  roleCardTitleActive: {
    color: C.brand,
  },
  roleCardDesc: {
    fontSize: 9,
    color: C.textMuted,
    lineHeight: 12,
  },
});
