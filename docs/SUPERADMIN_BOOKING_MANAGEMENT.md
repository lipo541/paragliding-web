# SuperAdmin Booking Management System

## 🎯 მიზანი
სრული კონტროლის სისტემა ჯავშნების მართვისთვის, რომელიც საშუალებას აძლევს SuperAdmin-ს მართოს ნებისმიერი სიტუაცია კლიენტთან ურთიერთობაში.

---

## 📊 ჯავშნის სტატუსები

### ძირითადი სტატუსები (booking_status)
| სტატუსი | აღწერა | ფერი |
|---------|--------|------|
| `pending` | მომლოდინე - ახალი ჯავშანი | 🟡 ყვითელი |
| `confirmed` | დადასტურებული - პილოტმა/კომპანიამ დაადასტურა | 🔵 ლურჯი |
| `completed` | დასრულებული - ფრენა წარმატებით დასრულდა | 🟢 მწვანე |
| `cancelled` | გაუქმებული | 🔴 წითელი |
| `on_hold` | 🆕 შეჩერებული - დროებით პაუზაზე | 🟠 ნარინჯისფერი |
| `no_show` | 🆕 კლიენტი არ გამოცხადდა | ⚫ შავი |
| `rescheduled` | 🆕 გადატანილი - თარიღი შეიცვალა | 🟣 იისფერი |

### გადახდის სტატუსები (payment_status)
| სტატუსი | აღწერა |
|---------|--------|
| `pending_deposit` | დეპოზიტი არ არის გადახდილი |
| `deposit_paid` | დეპოზიტი გადახდილი (50₾ × რაოდენობა) |
| `fully_paid` | სრულად გადახდილი |
| `partially_refunded` | 🆕 ნაწილობრივ დაბრუნებული |
| `fully_refunded` | სრულად დაბრუნებული |
| `failed` | გადახდა ჩაიშალა |

---

## 🔧 SuperAdmin ფუნქციონალი

### 1. სტატუსის მართვა

#### 1.1 დადასტურება (Confirm)
- პილოტის/კომპანიის მაგივრად დადასტურება
- შეტყობინების გაგზავნა კლიენტს

#### 1.2 გაუქმება (Cancel)
- გაუქმების მიზეზის მითითება (სავალდებულო)
- დეპოზიტის დაბრუნების არჩევანი
- შეტყობინება კლიენტს

#### 1.3 დასრულება (Complete)
- ხელით დასრულება თუ პილოტს დაავიწყდა
- amount_due-ს აღნიშვნა გადახდილად

#### 1.4 შეჩერება (On Hold)
- დროებით შეჩერება (ამინდი, ტექნიკური პრობლემა)
- მიზეზის მითითება
- ავტომატური შეხსენება

#### 1.5 No-Show
- კლიენტი არ გამოცხადდა
- დეპოზიტის მართვა (დაბრუნება/შენარჩუნება)

---

### 2. თარიღის მართვა (Reschedule)

#### 2.1 თარიღის გადაწევა
```typescript
interface RescheduleData {
  booking_id: string;
  new_date: string;           // YYYY-MM-DD
  reason: string;             // მიზეზი
  notify_customer: boolean;   // შეტყობინება კლიენტს
  notify_pilot: boolean;      // შეტყობინება პილოტს
  initiated_by: 'customer' | 'pilot' | 'company' | 'admin' | 'weather';
}
```

#### 2.2 Reschedule ლიმიტები
- მაქსიმუმ 2 გადაწევა ერთ ჯავშანზე
- მინიმუმ 24 საათით ადრე
- SuperAdmin-ს შეუძლია ლიმიტების იგნორირება

---

### 3. მინიჭების მართვა (Assignment)

#### 3.1 პილოტის შეცვლა
```typescript
interface ReassignPilot {
  booking_id: string;
  new_pilot_id: string;
  reason: string;
  notify_old_pilot: boolean;
  notify_new_pilot: boolean;
  notify_customer: boolean;
}
```

#### 3.2 კომპანიის შეცვლა
- მთლიანად სხვა კომპანიაზე გადატანა
- პილოტის ავტომატური მოხსნა
- ახალი კომპანია თვითონ დანიშნავს პილოტს

#### 3.3 Unassign (Pool-ში დაბრუნება)
- პილოტის და კომპანიის მოხსნა
- booking_source → platform_general
- ხელახლა განაწილებისთვის

---

### 4. ფინანსური მართვა

#### 4.1 დეპოზიტის დაბრუნება (Full Refund)
```typescript
interface RefundData {
  booking_id: string;
  refund_type: 'full' | 'partial';
  refund_amount: number;
  reason: string;
  process_stripe_refund: boolean;  // Stripe-ით დაბრუნება
}
```

#### 4.2 ნაწილობრივი დაბრუნება
- თანხის პროცენტის მითითება
- მიზეზის ჩაწერა

#### 4.3 ფასის კორექტირება
```typescript
interface PriceAdjustment {
  booking_id: string;
  adjustment_type: 'discount' | 'surcharge' | 'correction';
  amount: number;
  reason: string;
  recalculate_deposit: boolean;
}
```

#### 4.4 გადახდის სტატუსის ცვლილება
- ხელით მონიშვნა გადახდილად
- Cash payment-ის აღნიშვნა
- Failed → Retry

---

### 5. შენიშვნები და კომუნიკაცია

#### 5.1 Internal Notes (შიდა შენიშვნები)
```typescript
interface BookingNote {
  id: string;
  booking_id: string;
  author_id: string;
  author_name: string;
  note: string;
  note_type: 'info' | 'warning' | 'action' | 'customer_contact';
  is_pinned: boolean;
  created_at: string;
}
```

#### 5.2 კომუნიკაციის ლოგი
- ზარების ჩანაწერი
- SMS/Email ისტორია
- WhatsApp კონტაქტი

---

### 6. აუდიტის ლოგი

#### 6.1 Booking History Table
```sql
CREATE TABLE booking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  
  -- რა შეიცვალა
  action VARCHAR(50) NOT NULL,  -- 'status_change', 'reschedule', 'reassign', 'refund', etc.
  
  -- ძველი და ახალი მნიშვნელობები
  old_value JSONB,
  new_value JSONB,
  
  -- ვინ შეცვალა
  changed_by UUID REFERENCES profiles(id),
  changed_by_role VARCHAR(20),  -- 'admin', 'pilot', 'company', 'system'
  
  -- მეტადატა
  reason TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📱 UI კომპონენტები

### SuperAdmin Booking Detail Modal
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 ჯავშანი #12345                              [X] დახურვა │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 👤 კლიენტი                    📅 თარიღი                    │
│ გიორგი გიორგაძე               Dec 15, 2025                 │
│ 📞 555123456                   🕐 10:00                     │
│ [WhatsApp] [Call] [SMS]        [📅 გადაწევა]               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 📍 ლოკაცია                    ✈️ ფრენა                     │
│ გუდაური                       ტანდემ ფრენა                 │
│ საქართველო                    👥 3 ადამიანი                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 💰 ფინანსები                                               │
│ ┌─────────────┬─────────────┬─────────────┐                │
│ │ ჯამი        │ საკომისიო   │ მისაღები    │                │
│ │ 600 GEL     │ 150 GEL     │ 450 GEL     │                │
│ └─────────────┴─────────────┴─────────────┘                │
│ სტატუსი: 🟡 დეპოზიტი გადახდილი                            │
│ [💳 Refund] [📝 Adjust Price]                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 👨‍✈️ მინიჭება                                                │
│ კომპანია: Sky Georgia          [🔄 შეცვლა]                 │
│ პილოტი: გიორგი ქათამაძე        [🔄 შეცვლა]                 │
│                                [❌ Unassign]                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 📝 შენიშვნები                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 📌 [Admin] კლიენტს აქვს ფობია - ფრთხილად!             ││
│ │ [Info] გადაიხადა cash-ით ადგილზე - 12/10              ││
│ └─────────────────────────────────────────────────────────┘│
│ [+ შენიშვნის დამატება]                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 📜 ისტორია                                                 │
│ • Dec 10, 14:30 - შეიქმნა (კლიენტი)                        │
│ • Dec 10, 15:00 - დადასტურდა (პილოტი)                      │
│ • Dec 11, 10:00 - გადაიწია Dec 15-ზე (ამინდი)              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ⚡ სწრაფი მოქმედებები                                       │
│ [✅ დადასტურება] [❌ გაუქმება] [✔️ დასრულება]             │
│ [⏸️ შეჩერება] [👻 No-Show] [🔄 Reschedule]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Changes

### 1. booking_status enum განახლება
```sql
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'on_hold';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'no_show';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rescheduled';
```

### 2. bookings table ახალი სვეტები
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  -- Reschedule
  original_date DATE,
  reschedule_count INT DEFAULT 0,
  last_rescheduled_at TIMESTAMPTZ,
  reschedule_reason TEXT,
  
  -- Refund
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_status VARCHAR(20) DEFAULT 'none',
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  refunded_by UUID,
  
  -- No-Show
  no_show_at TIMESTAMPTZ,
  no_show_action VARCHAR(20),  -- 'refund', 'keep_deposit', 'reschedule'
  
  -- On Hold
  on_hold_reason TEXT,
  on_hold_until DATE,
  
  -- Internal
  internal_notes TEXT,
  priority VARCHAR(10) DEFAULT 'normal',  -- 'low', 'normal', 'high', 'urgent'
  tags TEXT[];  -- ['VIP', 'repeat_customer', 'problematic']
```

### 3. booking_notes table
```sql
CREATE TABLE IF NOT EXISTS booking_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  note TEXT NOT NULL,
  note_type VARCHAR(20) DEFAULT 'info',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. booking_history table (აუდიტი)
```sql
CREATE TABLE IF NOT EXISTS booking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES profiles(id),
  changed_by_role VARCHAR(20),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_history_booking_id ON booking_history(booking_id);
CREATE INDEX idx_booking_history_created_at ON booking_history(created_at DESC);
```

---

## 🔐 უსაფრთხოება

### RLS Policies
- booking_history: მხოლოდ SuperAdmin-ს შეუძლია წაკითხვა
- booking_notes: SuperAdmin + assigned pilot/company
- Refund actions: მხოლოდ SuperAdmin

### Audit Trail
- ყველა ცვლილება ლოგირდება
- IP მისამართი და User Agent
- შეუძლებელია ისტორიის წაშლა

---

## 📋 Implementation Checklist

### Phase 1: Database
- [ ] booking_status enum განახლება
- [ ] bookings table ახალი სვეტები
- [ ] booking_notes table
- [ ] booking_history table
- [ ] RLS policies

### Phase 2: API/Functions
- [ ] rescheduleBooking function
- [ ] reassignBooking function  
- [ ] refundBooking function
- [ ] addBookingNote function
- [ ] getBookingHistory function

### Phase 3: UI Components
- [ ] SuperAdminBookingModal
- [ ] RescheduleDialog
- [ ] ReassignDialog
- [ ] RefundDialog
- [ ] BookingNotesSection
- [ ] BookingHistoryTimeline

### Phase 4: Integration
- [ ] Stripe Refund integration
- [ ] SMS/Email notifications
- [ ] Real-time updates

---

## 🎯 Priority Features

1. **P0 - Critical**
   - Reschedule (თარიღის გადაწევა)
   - Full Refund (დეპოზიტის დაბრუნება)
   - Reassign Pilot/Company

2. **P1 - High**
   - Booking Notes
   - Booking History
   - No-Show handling

3. **P2 - Medium**
   - Partial Refund
   - Price Adjustment
   - On Hold status

4. **P3 - Nice to have**
   - SMS integration
   - Email templates
   - Bulk actions
