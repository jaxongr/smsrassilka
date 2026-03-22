# CORE RULES
1. Backend: NestJS + Prisma + PostgreSQL + Redis
2. Admin: Vite + React + AntD + Styled-components + Axios + React-Query + TS
3. Code: Best practice, clean, readable, modular
4. Mobile: Flutter
5. UI/UX: Yandex-style, eye-friendly colors, premium quality
6. Design: Consistent, follow single pattern
7. Cache: Redis-powered, efficient caching strategy

# SCALABILITY (50K+ users)
8. Modular microservice-ready architecture
....9. Database: indexing, pooling, read replicas, sharding strategy
10. Load balancing ready, stateless design
11. Advanced caching: multi-level, invalidation, warming

# SECURITY & RELIABILITY
12. JWT auth (access + refresh), RBAC, rate limiting, input validation
13. Monitoring: Winston logging, Sentry error tracking, health checks
14. Backup strategy & disaster recovery

# CODE QUALITY
15. Testing: 70%+ coverage (Jest, integration, e2e)
16. Standards: ESLint, Prettier, Husky, Conventional Commits
17. Documentation: Swagger API docs, README per module, ADR

# FRONTEND EXCELLENCE
18. Performance: code splitting, lazy loading, memoization, bundle optimization
19. UX: error boundaries, toast notifications, loading states, offline support
20. Accessibility: WCAG standards, keyboard navigation, screen readers

# MOBILE — YO'LDA DESIGN STANDARD (FAQAT mobile/ papkaga tegishli, dashboard va botga DAXLI YO'Q)
21. Flutter: offline-first, responsive, platform-optimized

## Mobile Design Standard (FAQAT mobile app ekranlari uchun — dashboard va bot o'z standartlarida ishlaydi)

### Colors — FAQAT AppTheme.* ishlatilsin, hardcoded rang TAQIQLANGAN
- `AppTheme.primary` (#6B46C1) — asosiy binafsha
- `AppTheme.accent` (#2DD4A8) — teal aksent
- `AppTheme.textPrimary` (#1A1A2E) — asosiy matn
- `AppTheme.textSecondary` (#999999) — ikkilamchi matn
- `AppTheme.textHint` (#BBBBBB) — hint matn
- `AppTheme.bgBody` (#FAF9FE) — scaffold fon
- `AppTheme.cardBg` (#FFFFFF) — karta fon
- `AppTheme.cardBorder` (#F0EEF5) — karta border
- `AppTheme.errorColor` (#EF4444) — xato
- `AppTheme.successColor` (#16A34A) — muvaffaqiyat
- `AppTheme.warningColor` (#F59E0B) — ogohlantirish
- `AppTheme.walletGradient` — binafsha gradient
- `AppTheme.testrGradient` — yashil gradient

### Font: Outfit (GoogleFonts, theme orqali keladi)

### Radius
- `AppTheme.radiusSmall` (8) — pill, badge
- `AppTheme.radiusMedium` (12) — input, button
- `AppTheme.radiusLarge` (16) — card, container
- `AppTheme.radiusXLarge` (24) — banner, bottom sheet

### Spacing
- `AppTheme.spacingXS` (4), `spacingS` (8), `spacingM` (16), `spacingL` (24), `spacingXL` (32)

### Screen Template (BARCHA ekranlar shu strukturada bo'lishi kerak):
```dart
import '../../config/theme.dart';
import '../../widgets/app_scaffold.dart'; // scaffoldKeyProvider uchun

class XyzScreen extends ConsumerStatefulWidget {
  // AppBar: leading=hamburger (tab screens) yoki back button (standalone)
  // Tab screens uchun drawer: ref.read(scaffoldKeyProvider).currentState?.openDrawer()
  // Scaffold backgroundColor: AppTheme.bgBody
  // Barcha ranglar: AppTheme.* dan olinadi
  // Pull to refresh: RefreshIndicator
  // Loading: CircularProgressIndicator(color: AppTheme.primary)
  // Empty: icon + "Ma'lumot topilmadi" matn
  // Error: icon + xato matni + "Qayta yuklash" tugma
}
```

### Order Card Standard:
- Container: white bg, 1px AppTheme.cardBorder, borderRadius 16
- Sender row: CircleAvatar (initial), ism, mashina turi badge
- Route row: A dot (primary) → dotted line → B dot (accent), cargoFrom/cargoTo
- Info row: sana, og'irlik, scope badge
- Bottom row: narx + "Qabul qilish" tugma (faqat NEW status)
- Shadow: MINIMAL (0x05000000, blur 8, offset 2)

### Provider Usage:
- ordersProvider → Buyurtmalar
- acceptedOrdersProvider → Qabul qilinganlar
- balanceProvider → Balans
- chatProvider → Chat
- notificationsProvider → Bildirishnomalar
- supportProvider → Qo'llab-quvvatlash
- authStateProvider → Foydalanuvchi

### Navigation:
- Bottom tabs: context.go() — Asosiy, Qabul, Chat, Balans
- Drawer screens: context.push() — Archive, Notifications, Support, Subscribe, etc.
- Tab screens drawer: ref.read(scaffoldKeyProvider).currentState?.openDrawer()

### TAQIQLAR:
- ❌ Hardcoded ranglar (const Color(0xFF...)) — FAQAT AppTheme.*
- ❌ Shadows — minimal yoki yo'q
- ❌ Gradients on cards — faqat wallet banner va testr natija
- ❌ Mock data — hamma joyda real provider/API
- ❌ String literal bilan role tekshirish bir necha joyda inconsistent bo'lmasin — `user?.role.value == 'DRIVER'` usulini yagona standart sifatida ishlating

# INFRASTRUCTURE
22. CI/CD: automated testing & deployment
23. Analytics & metrics tracking
24. i18n infrastructure ready
