/**
 * SUCCESS OS — Global Marketplace, Booking & Commerce Engine
 *
 * Listings, booking, availability, search, cart/checkout, orders, reviews,
 * subscriptions, recommendations, affiliates, disputes, analytics, security.
 * Integrates with payment + commission engines. No duplicated users/data.
 */

import path from 'node:path';
import {
  MARKET_BOOKING_TYPES,
  MARKET_DEFAULT_CONFIG,
  MARKET_DELIVERY_MODES,
  MARKET_LISTING_TYPES,
  MARKET_ORDER_STATUSES,
  MARKET_SEARCH_FILTERS,
  MARKET_SEED_COUPONS,
  MARKET_SEED_GIFT_CARDS,
  MARKET_SEED_LISTINGS,
  MARKET_SUBSCRIPTION_PLANS,
} from '../../data/enterprise-marketplace-catalog.js';
import {
  erpActiveItems,
  erpAppendAudit,
  erpEnsureDirs,
  erpId,
  erpList,
  erpNow,
  erpReadCollection,
  erpReadJson,
  erpRoot,
  erpText,
  erpWriteCollection,
  erpWriteJson,
} from './enterprise-erp-store.js';
import { processSuccessfulPayment, PAYOUT_METHODS } from './enterprise-payment-engine.js';
import { ensureCommissionDefaults } from './enterprise-commission-engine.js';

const COLLECTIONS = Object.freeze({
  listings: 'market-listings',
  availability: 'market-availability',
  bookings: 'market-bookings',
  carts: 'market-carts',
  orders: 'market-orders',
  reviews: 'market-reviews',
  subscriptions: 'market-subscriptions',
  coupons: 'market-coupons',
  giftCards: 'market-gift-cards',
  affiliates: 'market-affiliates',
  referrals: 'market-referrals',
  loyalty: 'market-loyalty',
  disputes: 'market-disputes',
  fraud: 'market-fraud-events',
  audit: 'market-audit',
});

const CONFIG_FILE = () => path.join(erpRoot(), 'config', 'marketplace-engine.json');

function liveBus() {
  if (!globalThis.__SUCCESS_OS_MARKET_BUS__) {
    globalThis.__SUCCESS_OS_MARKET_BUS__ = { listeners: new Set(), version: 0, last: null };
  }
  return globalThis.__SUCCESS_OS_MARKET_BUS__;
}

export function subscribeMarketLive(listener) {
  const bus = liveBus();
  bus.listeners.add(listener);
  return () => bus.listeners.delete(listener);
}

function publishLive(event) {
  const bus = liveBus();
  bus.version += 1;
  bus.last = { ...event, version: bus.version, at: erpNow() };
  for (const listener of bus.listeners) {
    try {
      listener(bus.last);
    } catch {
      /* ignore */
    }
  }
}

function money(n) {
  return Number(Number(n || 0).toFixed(2));
}

function ensureCollection(name, seed = []) {
  erpEnsureDirs();
  const file = path.join(erpRoot(), 'collections', `${name}.json`);
  if (erpReadJson(file)) return erpReadJson(file);
  const doc = { items: seed, updatedAt: erpNow() };
  erpWriteCollection(name, doc);
  return doc;
}

export function getMarketConfig() {
  erpEnsureDirs();
  const existing = erpReadJson(CONFIG_FILE());
  if (existing) return { ...MARKET_DEFAULT_CONFIG, ...existing };
  const seeded = { ...MARKET_DEFAULT_CONFIG, updatedAt: erpNow(), updatedBy: 'system' };
  erpWriteJson(CONFIG_FILE(), seeded);
  return seeded;
}

export function setMarketConfig(patch = {}, meta = {}) {
  const before = getMarketConfig();
  const next = { ...before, ...patch, updatedAt: erpNow(), updatedBy: meta.user || 'owner' };
  erpWriteJson(CONFIG_FILE(), next);
  erpAppendAudit({
    action: 'market_config',
    moduleId: 'global-marketplace',
    user: meta.user || 'owner',
    oldValue: before,
    newValue: next,
  });
  publishLive({ type: 'config.updated' });
  return { ok: true, config: next };
}

function pushItem(collection, item) {
  const doc = erpReadCollection(collection);
  erpWriteCollection(collection, { items: [item, ...erpList(doc.items)].slice(0, 50000) });
  return item;
}

function updateItem(collection, id, patch) {
  const doc = erpReadCollection(collection);
  const items = erpList(doc.items).map((i) => (i.id === id ? { ...i, ...patch, updatedAt: erpNow() } : i));
  erpWriteCollection(collection, { items });
  return items.find((i) => i.id === id) || null;
}

function audit(entry) {
  const row = { id: erpId(), at: erpNow(), ...entry };
  pushItem(COLLECTIONS.audit, row);
  erpAppendAudit({
    action: entry.action || 'marketplace',
    moduleId: 'global-marketplace',
    user: entry.user || 'system',
    newValue: entry,
  });
  return row;
}

function seedListings() {
  return MARKET_SEED_LISTINGS.map((l) => ({
    id: erpId(),
    ...l,
    status: 'active',
    salesCount: 0,
    bookingCount: 0,
    qualityScore: Number(l.rating || 0) * 20,
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

function seedAvailability(listings) {
  return listings.map((l) => ({
    id: erpId(),
    listingId: l.id,
    providerId: l.providerId || l.key,
    timezone: 'Asia/Amman',
    workingHours: { start: '09:00', end: '17:00' },
    availableDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
    timeSlots: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'],
    blackoutDates: [],
    vacation: [],
    maxDailyBookings: getMarketConfig().maxDailyBookingsDefault || 8,
    status: 'active',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  }));
}

function seedCoupons() {
  return MARKET_SEED_COUPONS.map((c) => ({
    id: erpId(),
    ...c,
    used: 0,
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

function seedGiftCards() {
  return MARKET_SEED_GIFT_CARDS.map((g) => ({
    id: erpId(),
    ...g,
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

/** Sync marketplace listings from existing ERP entities (no duplicated users/providers). */
export function syncListingsFromErp(meta = {}) {
  ensureMarketplaceEngine();
  const existing = erpActiveItems(erpReadCollection(COLLECTIONS.listings).items);
  const byKey = new Set(existing.map((l) => l.key).filter(Boolean));
  const created = [];

  const mapEntity = (collection, listingType, bookingType, price = 20) => {
    for (const row of erpActiveItems(erpReadCollection(collection).items)) {
      const key = `erp_${listingType}_${row.id}`;
      if (byKey.has(key)) continue;
      const listing = {
        id: erpId(),
        key,
        title: row.name || row.title || `${listingType} · ${row.id}`,
        titleAr: row.nameAr || row.name || row.title,
        listingType,
        bookingType,
        providerId: row.id,
        providerRole: listingType,
        price: Number(row.price || row.fee || price),
        currency: row.currency || getMarketConfig().defaultCurrency,
        country: row.country || 'Jordan',
        city: row.city || null,
        language: row.language || 'ar',
        subject: row.subject || null,
        grade: row.grade || null,
        curriculum: row.curriculum || null,
        educationalSystem: row.system || row.educationalSystem || null,
        universityMajor: row.major || null,
        deliveryMode: row.deliveryMode || 'online',
        rating: Number(row.rating || 0),
        experienceYears: Number(row.experienceYears || row.experience || 0),
        certification: Boolean(row.certification || row.certified),
        gender: row.gender || null,
        verified: Boolean(row.verified || row.status === 'active'),
        status: 'active',
        salesCount: 0,
        bookingCount: 0,
        qualityScore: Number(row.rating || 0) * 20,
        createdAt: erpNow(),
        updatedAt: erpNow(),
        source: 'erp_sync',
      };
      pushItem(COLLECTIONS.listings, listing);
      byKey.add(key);
      created.push(listing);
    }
  };

  mapEntity('teachers', 'teacher', 'private_lesson', 25);
  mapEntity('educational-centers', 'educational_center', 'group_class', 18);
  mapEntity('schools', 'school', 'school_visit', 0);
  mapEntity('universities', 'university', 'university_appointment', 0);
  mapEntity('employers', 'employer', 'interview', 0);
  mapEntity('recruitment-companies', 'recruitment_company', 'career_session', 30);
  mapEntity('courses', 'course', 'recorded_course', 49);
  mapEntity('recorded-lessons', 'recorded_lesson', 'recorded_course', 12);
  mapEntity('live-classes', 'live_class', 'group_class', 15);
  mapEntity('books', 'book', 'online_service', 9);
  mapEntity('question-bank', 'question_bank', 'online_service', 19);
  mapEntity('exams', 'exam', 'online_service', 14);
  mapEntity('scholarships', 'scholarship', 'admission', 0);
  mapEntity('study-abroad', 'study_abroad', 'consultation', 35);

  publishLive({ type: 'listings.synced', count: created.length });
  audit({ action: 'listings.sync', user: meta.user || 'owner', count: created.length });
  return { ok: true, created: created.length };
}

export function ensureMarketplaceEngine() {
  getMarketConfig();
  ensureCommissionDefaults();
  const listingsDoc = ensureCollection(COLLECTIONS.listings, seedListings());
  const listings = erpList(listingsDoc.items);
  ensureCollection(COLLECTIONS.availability, seedAvailability(listings));
  ensureCollection(COLLECTIONS.bookings, []);
  ensureCollection(COLLECTIONS.carts, []);
  ensureCollection(COLLECTIONS.orders, []);
  ensureCollection(COLLECTIONS.reviews, []);
  ensureCollection(COLLECTIONS.subscriptions, []);
  ensureCollection(COLLECTIONS.coupons, seedCoupons());
  ensureCollection(COLLECTIONS.giftCards, seedGiftCards());
  ensureCollection(COLLECTIONS.affiliates, []);
  ensureCollection(COLLECTIONS.referrals, []);
  ensureCollection(COLLECTIONS.loyalty, []);
  ensureCollection(COLLECTIONS.disputes, []);
  ensureCollection(COLLECTIONS.fraud, []);
  ensureCollection(COLLECTIONS.audit, []);
  return { ok: true };
}

export function searchMarketplace(filters = {}) {
  ensureMarketplaceEngine();
  let items = erpActiveItems(erpReadCollection(COLLECTIONS.listings).items).filter((l) => l.status === 'active');

  const q = erpText(filters.q).toLowerCase();
  if (q) items = items.filter((l) => JSON.stringify(l).toLowerCase().includes(q));
  if (filters.listingType) items = items.filter((l) => l.listingType === filters.listingType);
  if (filters.country) items = items.filter((l) => String(l.country || '').toLowerCase() === String(filters.country).toLowerCase());
  if (filters.city) items = items.filter((l) => String(l.city || '').toLowerCase() === String(filters.city).toLowerCase());
  if (filters.language) items = items.filter((l) => String(l.language || '').toLowerCase() === String(filters.language).toLowerCase());
  if (filters.educationalSystem) items = items.filter((l) => String(l.educationalSystem || '').toLowerCase().includes(String(filters.educationalSystem).toLowerCase()));
  if (filters.curriculum) items = items.filter((l) => String(l.curriculum || '').toLowerCase().includes(String(filters.curriculum).toLowerCase()));
  if (filters.grade) items = items.filter((l) => String(l.grade || '') === String(filters.grade));
  if (filters.subject) items = items.filter((l) => String(l.subject || '').toLowerCase().includes(String(filters.subject).toLowerCase()));
  if (filters.universityMajor) items = items.filter((l) => String(l.universityMajor || '').toLowerCase().includes(String(filters.universityMajor).toLowerCase()));
  if (filters.teacher) items = items.filter((l) => String(l.title || '').toLowerCase().includes(String(filters.teacher).toLowerCase()) || l.listingType === 'teacher');
  if (filters.priceMin != null && filters.priceMin !== '') items = items.filter((l) => Number(l.price || 0) >= Number(filters.priceMin));
  if (filters.priceMax != null && filters.priceMax !== '') items = items.filter((l) => Number(l.price || 0) <= Number(filters.priceMax));
  if (filters.ratingMin != null && filters.ratingMin !== '') items = items.filter((l) => Number(l.rating || 0) >= Number(filters.ratingMin));
  if (filters.deliveryMode) items = items.filter((l) => l.deliveryMode === filters.deliveryMode);
  if (filters.online === true || filters.online === '1') items = items.filter((l) => ['online', 'hybrid'].includes(l.deliveryMode));
  if (filters.offline === true || filters.offline === '1') items = items.filter((l) => ['offline', 'hybrid'].includes(l.deliveryMode));
  if (filters.hybrid === true || filters.hybrid === '1') items = items.filter((l) => l.deliveryMode === 'hybrid');
  if (filters.experienceMin != null && filters.experienceMin !== '') items = items.filter((l) => Number(l.experienceYears || 0) >= Number(filters.experienceMin));
  if (filters.certification === true || filters.certification === '1') items = items.filter((l) => l.certification);
  if (filters.gender) items = items.filter((l) => !l.gender || l.gender === filters.gender);
  if (filters.availability) {
    const avail = erpActiveItems(erpReadCollection(COLLECTIONS.availability).items);
    const availableIds = new Set(avail.filter((a) => a.status === 'active' && (a.timeSlots || []).length).map((a) => a.listingId));
    items = items.filter((l) => availableIds.has(l.id));
  }

  items = [...items].sort((a, b) => Number(b.qualityScore || b.rating || 0) - Number(a.qualityScore || a.rating || 0));
  return {
    ok: true,
    total: items.length,
    filters,
    items: items.slice(0, Number(filters.limit) || 200),
    generatedAt: erpNow(),
  };
}

function getAvailability(listingId) {
  return erpActiveItems(erpReadCollection(COLLECTIONS.availability).items).find((a) => a.listingId === listingId) || null;
}

function detectBookingConflict(listingId, slotDate, slotTime) {
  const day = String(slotDate || '').slice(0, 10);
  const bookings = erpActiveItems(erpReadCollection(COLLECTIONS.bookings).items).filter(
    (b) =>
      b.listingId === listingId &&
      ['pending', 'confirmed'].includes(b.status) &&
      String(b.slotDate || '').slice(0, 10) === day &&
      b.slotTime === slotTime,
  );
  return bookings.length > 0;
}

export function upsertAvailability(payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  if (payload.id) {
    const item = updateItem(COLLECTIONS.availability, payload.id, payload);
    publishLive({ type: 'availability.updated', id: payload.id });
    return item ? { ok: true, availability: item } : { ok: false, error: 'NOT_FOUND' };
  }
  const item = {
    id: erpId(),
    listingId: payload.listingId,
    providerId: payload.providerId || meta.user || 'owner',
    timezone: payload.timezone || 'Asia/Amman',
    workingHours: payload.workingHours || { start: '09:00', end: '17:00' },
    availableDays: payload.availableDays || ['sun', 'mon', 'tue', 'wed', 'thu'],
    timeSlots: payload.timeSlots || ['09:00', '10:00', '11:00', '14:00', '15:00'],
    blackoutDates: payload.blackoutDates || [],
    vacation: payload.vacation || [],
    maxDailyBookings: Number(payload.maxDailyBookings || getMarketConfig().maxDailyBookingsDefault || 8),
    status: 'active',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.availability, item);
  publishLive({ type: 'availability.created', id: item.id });
  return { ok: true, availability: item };
}

export function createBooking(payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  const listing = erpActiveItems(erpReadCollection(COLLECTIONS.listings).items).find((l) => l.id === payload.listingId);
  if (!listing) return { ok: false, error: 'LISTING_NOT_FOUND' };

  const config = getMarketConfig();
  if (config.requireVerifiedProviders && !listing.verified) {
    return { ok: false, error: 'PROVIDER_NOT_VERIFIED' };
  }

  const slotDate = payload.slotDate || erpNow().slice(0, 10);
  const slotTime = payload.slotTime || '10:00';
  const avail = getAvailability(listing.id);

  if (avail) {
    const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(slotDate).getDay()];
    if (avail.availableDays?.length && !avail.availableDays.includes(dayName)) {
      return { ok: false, error: 'DAY_NOT_AVAILABLE' };
    }
    if (avail.timeSlots?.length && !avail.timeSlots.includes(slotTime)) {
      return { ok: false, error: 'SLOT_NOT_AVAILABLE' };
    }
    if ((avail.blackoutDates || []).includes(slotDate) || (avail.vacation || []).includes(slotDate)) {
      return { ok: false, error: 'BLACKOUT_OR_VACATION' };
    }
    const dayBookings = erpActiveItems(erpReadCollection(COLLECTIONS.bookings).items).filter(
      (b) => b.listingId === listing.id && String(b.slotDate || '').slice(0, 10) === slotDate && ['pending', 'confirmed'].includes(b.status),
    );
    if (dayBookings.length >= Number(avail.maxDailyBookings || 8)) {
      return { ok: false, error: 'MAX_DAILY_BOOKINGS' };
    }
  }

  if (detectBookingConflict(listing.id, slotDate, slotTime)) {
    return { ok: false, error: 'BOOKING_CONFLICT' };
  }

  const booking = {
    id: erpId(),
    listingId: listing.id,
    listingTitle: listing.title,
    listingType: listing.listingType,
    bookingType: MARKET_BOOKING_TYPES.includes(payload.bookingType) ? payload.bookingType : listing.bookingType || 'online_service',
    userId: meta.user || payload.userId || 'student',
    providerId: listing.providerId || listing.key,
    slotDate,
    slotTime,
    timezone: avail?.timezone || payload.timezone || 'Asia/Amman',
    deliveryMode: payload.deliveryMode || listing.deliveryMode || 'online',
    price: Number(listing.price || 0),
    currency: listing.currency || config.defaultCurrency,
    status: 'pending',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.bookings, booking);
  updateItem(COLLECTIONS.listings, listing.id, { bookingCount: Number(listing.bookingCount || 0) + 1 });
  // Mirror into notification jobs
  pushItem('notification-jobs', {
    id: erpId(),
    name: `Booking created · ${booking.listingTitle}`,
    channel: 'in_app',
    subject: 'New booking',
    body: `${booking.slotDate} ${booking.slotTime}`,
    status: 'queued',
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'marketplace',
  });
  audit({ action: 'booking.create', user: meta.user || 'student', bookingId: booking.id });
  publishLive({ type: 'booking.created', bookingId: booking.id });
  return { ok: true, booking };
}

function getOrCreateCart(userId) {
  const carts = erpActiveItems(erpReadCollection(COLLECTIONS.carts).items);
  let cart = carts.find((c) => c.userId === userId && c.status === 'open');
  if (!cart) {
    cart = {
      id: erpId(),
      userId,
      items: [],
      couponCode: null,
      giftCardCode: null,
      status: 'open',
      createdAt: erpNow(),
      updatedAt: erpNow(),
    };
    pushItem(COLLECTIONS.carts, cart);
  }
  return cart;
}

export function addToCart(payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  const userId = meta.user || payload.userId || 'student';
  const listing = erpActiveItems(erpReadCollection(COLLECTIONS.listings).items).find((l) => l.id === payload.listingId);
  if (!listing) return { ok: false, error: 'LISTING_NOT_FOUND' };
  const cart = getOrCreateCart(userId);
  const items = [...(cart.items || [])];
  items.push({
    id: erpId(),
    listingId: listing.id,
    title: listing.title,
    price: Number(listing.price || 0),
    currency: listing.currency || getMarketConfig().defaultCurrency,
    quantity: Number(payload.quantity || 1),
    bookingId: payload.bookingId || null,
    bundleId: payload.bundleId || null,
  });
  const updated = updateItem(COLLECTIONS.carts, cart.id, { items });
  publishLive({ type: 'cart.updated', cartId: cart.id });
  return { ok: true, cart: updated };
}

function findCoupon(code) {
  return erpActiveItems(erpReadCollection(COLLECTIONS.coupons).items).find(
    (c) => c.code?.toUpperCase() === String(code || '').toUpperCase() && c.status === 'active',
  );
}

function findGiftCard(code) {
  return erpActiveItems(erpReadCollection(COLLECTIONS.giftCards).items).find(
    (g) => g.code?.toUpperCase() === String(code || '').toUpperCase() && g.status === 'active' && Number(g.balance || 0) > 0,
  );
}

export function applyCartPromo(payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  const userId = meta.user || payload.userId || 'student';
  const cart = getOrCreateCart(userId);
  const patch = {};
  if (payload.couponCode) {
    const coupon = findCoupon(payload.couponCode);
    if (!coupon) return { ok: false, error: 'INVALID_COUPON' };
    if (coupon.maxUses != null && Number(coupon.used || 0) >= Number(coupon.maxUses)) {
      return { ok: false, error: 'COUPON_EXHAUSTED' };
    }
    patch.couponCode = coupon.code;
  }
  if (payload.giftCardCode) {
    const gift = findGiftCard(payload.giftCardCode);
    if (!gift) return { ok: false, error: 'INVALID_GIFT_CARD' };
    patch.giftCardCode = gift.code;
  }
  const updated = updateItem(COLLECTIONS.carts, cart.id, patch);
  return { ok: true, cart: updated };
}

function calcCartTotals(cart) {
  const config = getMarketConfig();
  const subtotal = money((cart.items || []).reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 1), 0));
  let discount = 0;
  if (cart.couponCode) {
    const coupon = findCoupon(cart.couponCode);
    if (coupon) {
      discount = coupon.type === 'percent' ? money((subtotal * Number(coupon.value || 0)) / 100) : money(coupon.value);
    }
  }
  let giftApplied = 0;
  if (cart.giftCardCode) {
    const gift = findGiftCard(cart.giftCardCode);
    if (gift) giftApplied = money(Math.min(Number(gift.balance || 0), Math.max(0, subtotal - discount)));
  }
  const taxable = Math.max(0, subtotal - discount - giftApplied);
  const tax = money((taxable * Number(config.taxRatePercent || 0)) / 100);
  const total = money(taxable + tax);
  return { subtotal, discount, giftApplied, tax, total, currency: config.defaultCurrency };
}

function scoreFraud(order, meta = {}) {
  let score = 0;
  if (Number(order.total || 0) > 500) score += 20;
  if ((order.items || []).length > 10) score += 15;
  if (meta.rapidCheckout) score += 25;
  if (!meta.user || meta.user === 'guest') score += 30;
  return Math.min(100, score);
}

export function checkoutCart(payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  const userId = meta.user || payload.userId || 'student';
  const cart = getOrCreateCart(userId);
  if (!(cart.items || []).length) return { ok: false, error: 'CART_EMPTY' };

  const totals = calcCartTotals(cart);
  const config = getMarketConfig();
  const order = {
    id: erpId(),
    number: `ORD-${Date.now()}`,
    userId,
    items: cart.items,
    ...totals,
    paymentMethod: PAYOUT_METHODS.includes(payload.paymentMethod) ? payload.paymentMethod : 'manual_transfer',
    currency: totals.currency || config.defaultCurrency,
    status: 'pending',
    couponCode: cart.couponCode || null,
    giftCardCode: cart.giftCardCode || null,
    referralCode: payload.referralCode || null,
    affiliateCode: payload.affiliateCode || null,
    invoiceId: null,
    receiptId: null,
    paymentId: null,
    fraudScore: 0,
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  order.fraudScore = scoreFraud(order, meta);
  if (order.fraudScore >= Number(config.fraudScoreThreshold || 80)) {
    pushItem(COLLECTIONS.fraud, {
      id: erpId(),
      orderId: order.id,
      score: order.fraudScore,
      status: 'flagged',
      createdAt: erpNow(),
    });
    order.status = 'pending';
    order.fraudFlag = true;
  }

  // Process payment via existing finance engine (single source of payment truth).
  const payment = processSuccessfulPayment(
    {
      grossAmount: totals.subtotal,
      discount: totals.discount + totals.giftApplied,
      taxes: totals.tax,
      gatewayFees: 0,
      currency: order.currency,
      partnerId: cart.items[0]?.listingId || null,
      partnerType: 'marketplace',
      payoutMethod: order.paymentMethod,
      memo: `marketplace_order_${order.number}`,
    },
    { user: userId },
  );

  order.paymentId = payment.paymentId;
  order.invoiceId = payment.invoice?.id || null;
  order.receiptId = payment.receipt?.id || null;
  order.status = order.fraudFlag ? 'pending' : 'confirmed';
  pushItem(COLLECTIONS.orders, order);

  // Consume coupon / gift card
  if (cart.couponCode) {
    const coupon = findCoupon(cart.couponCode);
    if (coupon) updateItem(COLLECTIONS.coupons, coupon.id, { used: Number(coupon.used || 0) + 1 });
  }
  if (cart.giftCardCode && totals.giftApplied > 0) {
    const gift = findGiftCard(cart.giftCardCode);
    if (gift) updateItem(COLLECTIONS.giftCards, gift.id, { balance: money(Number(gift.balance || 0) - totals.giftApplied) });
  }

  // Loyalty points
  const points = Math.round(totals.total * Number(config.loyaltyPointsPerCurrency || 1));
  pushItem(COLLECTIONS.loyalty, {
    id: erpId(),
    userId,
    points,
    orderId: order.id,
    createdAt: erpNow(),
  });

  // Affiliate / referral tracking
  if (payload.affiliateCode || payload.referralCode) {
    const code = payload.affiliateCode || payload.referralCode;
    const commission = money((totals.total * Number(config.affiliateCommissionPercent || 0)) / 100);
    pushItem(COLLECTIONS.referrals, {
      id: erpId(),
      code,
      orderId: order.id,
      userId,
      commission,
      status: 'tracked',
      createdAt: erpNow(),
    });
    const affiliate = erpActiveItems(erpReadCollection(COLLECTIONS.affiliates).items).find((a) => a.code === code);
    if (affiliate) {
      updateItem(COLLECTIONS.affiliates, affiliate.id, {
        earnings: money(Number(affiliate.earnings || 0) + commission),
        conversions: Number(affiliate.conversions || 0) + 1,
      });
    } else {
      pushItem(COLLECTIONS.affiliates, {
        id: erpId(),
        code,
        ownerId: payload.affiliateOwnerId || 'partner',
        earnings: commission,
        conversions: 1,
        status: 'active',
        createdAt: erpNow(),
        updatedAt: erpNow(),
      });
    }
  }

  // Confirm linked bookings
  for (const item of cart.items) {
    if (item.bookingId) updateItem(COLLECTIONS.bookings, item.bookingId, { status: 'confirmed', orderId: order.id });
    if (item.listingId) {
      const listing = erpActiveItems(erpReadCollection(COLLECTIONS.listings).items).find((l) => l.id === item.listingId);
      if (listing) updateItem(COLLECTIONS.listings, listing.id, { salesCount: Number(listing.salesCount || 0) + Number(item.quantity || 1) });
    }
  }

  updateItem(COLLECTIONS.carts, cart.id, { items: [], status: 'checked_out', couponCode: null, giftCardCode: null });
  audit({ action: 'order.checkout', user: userId, orderId: order.id, total: order.total });
  publishLive({ type: 'order.created', orderId: order.id, status: order.status });
  return { ok: true, order, payment };
}

export function mutateOrder(orderId, action, payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  const order = erpActiveItems(erpReadCollection(COLLECTIONS.orders).items).find((o) => o.id === orderId);
  if (!order) return { ok: false, error: 'ORDER_NOT_FOUND' };

  if (action === 'confirm') {
    return { ok: true, order: updateItem(COLLECTIONS.orders, orderId, { status: 'confirmed' }) };
  }
  if (action === 'complete') {
    return { ok: true, order: updateItem(COLLECTIONS.orders, orderId, { status: 'completed', completedAt: erpNow() }) };
  }
  if (action === 'cancel') {
    return { ok: true, order: updateItem(COLLECTIONS.orders, orderId, { status: 'cancelled', cancelReason: payload.reason || '' }) };
  }
  if (action === 'request_refund') {
    const updated = updateItem(COLLECTIONS.orders, orderId, { status: 'refund_requested' });
    pushItem('refunds', {
      id: erpId(),
      orderId,
      amount: order.total,
      currency: order.currency,
      status: 'requested',
      reason: payload.reason || '',
      createdAt: erpNow(),
      updatedAt: erpNow(),
      source: 'marketplace',
    });
    publishLive({ type: 'order.refund_requested', orderId });
    return { ok: true, order: updated };
  }
  if (action === 'refund') {
    const updated = updateItem(COLLECTIONS.orders, orderId, { status: 'refunded', refundedAt: erpNow() });
    publishLive({ type: 'order.refunded', orderId });
    return { ok: true, order: updated };
  }
  return { ok: false, error: 'UNKNOWN_ORDER_ACTION' };
}

export function createReview(payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  const listing = erpActiveItems(erpReadCollection(COLLECTIONS.listings).items).find((l) => l.id === payload.listingId);
  if (!listing) return { ok: false, error: 'LISTING_NOT_FOUND' };
  const review = {
    id: erpId(),
    listingId: listing.id,
    orderId: payload.orderId || null,
    userId: meta.user || 'student',
    rating: Math.max(1, Math.min(5, Number(payload.rating || 5))),
    comment: erpText(payload.comment),
    verified: Boolean(payload.orderId),
    providerReply: null,
    reported: false,
    status: 'published',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.reviews, review);

  // Recompute listing rating / quality score
  const reviews = erpActiveItems(erpReadCollection(COLLECTIONS.reviews).items).filter((r) => r.listingId === listing.id && !r.reported);
  const avg = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length : listing.rating;
  updateItem(COLLECTIONS.listings, listing.id, {
    rating: money(avg),
    qualityScore: money(avg * 20),
  });
  publishLive({ type: 'review.created', reviewId: review.id });
  return { ok: true, review };
}

export function mutateReview(reviewId, action, payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  if (action === 'reply') {
    return { ok: true, review: updateItem(COLLECTIONS.reviews, reviewId, { providerReply: erpText(payload.reply), repliedBy: meta.user || 'provider', repliedAt: erpNow() }) };
  }
  if (action === 'report') {
    return { ok: true, review: updateItem(COLLECTIONS.reviews, reviewId, { reported: true, reportReason: payload.reason || 'abuse' }) };
  }
  return { ok: false, error: 'UNKNOWN_REVIEW_ACTION' };
}

export function createSubscription(payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  const plan = MARKET_SUBSCRIPTION_PLANS.find((p) => p.key === payload.plan) || MARKET_SUBSCRIPTION_PLANS[0];
  const startsAt = erpNow();
  const endsAt =
    plan.months === 0
      ? null
      : new Date(Date.now() + plan.months * 30 * 86400000).toISOString();
  const sub = {
    id: erpId(),
    userId: meta.user || payload.userId || 'student',
    plan: plan.key,
    listingId: payload.listingId || null,
    price: Number(payload.price || 29),
    currency: getMarketConfig().defaultCurrency,
    status: 'active',
    startsAt,
    endsAt,
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.subscriptions, sub);
  // Mirror partner-subscriptions for ERP visibility
  pushItem('partner-subscriptions', {
    id: sub.id,
    name: `${plan.label} · ${sub.userId}`,
    plan: plan.key,
    status: 'active',
    monthlyAmount: plan.months ? money(sub.price / plan.months) : sub.price,
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'marketplace',
  });
  publishLive({ type: 'subscription.created', id: sub.id });
  return { ok: true, subscription: sub };
}

export function recommendListings(payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  const userId = meta.user || payload.userId || 'student';
  const listings = erpActiveItems(erpReadCollection(COLLECTIONS.listings).items).filter((l) => l.status === 'active');
  const bookings = erpActiveItems(erpReadCollection(COLLECTIONS.bookings).items).filter((b) => b.userId === userId);
  const orders = erpActiveItems(erpReadCollection(COLLECTIONS.orders).items).filter((o) => o.userId === userId);
  const interests = new Set([
    ...(payload.interests || []),
    ...bookings.map((b) => b.listingType),
    ...orders.flatMap((o) => (o.items || []).map(() => null)),
  ].filter(Boolean));
  const country = payload.location || payload.country || null;

  const scored = listings.map((l) => {
    let score = Number(l.qualityScore || l.rating || 0);
    if (interests.has(l.listingType)) score += 15;
    if (payload.subject && String(l.subject || '').toLowerCase() === String(payload.subject).toLowerCase()) score += 20;
    if (country && l.country === country) score += 10;
    if (payload.goals?.includes?.('exam') && ['exam', 'question_bank', 'course'].includes(l.listingType)) score += 12;
    if (Number(l.salesCount || 0) > 0) score += Math.min(10, Number(l.salesCount));
    // AI boost placeholder
    if (l.listingType === 'ai_service') score += 5;
    return { ...l, recommendScore: money(score) };
  });

  return {
    ok: true,
    userId,
    items: scored.sort((a, b) => b.recommendScore - a.recommendScore).slice(0, Number(payload.limit) || 12),
    generatedAt: erpNow(),
  };
}

export function createDispute(payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  const dispute = {
    id: erpId(),
    orderId: payload.orderId || null,
    bookingId: payload.bookingId || null,
    userId: meta.user || 'student',
    subject: erpText(payload.subject) || 'Complaint',
    body: erpText(payload.body) || '',
    evidence: payload.evidence || [],
    status: 'open',
    decision: null,
    decidedBy: null,
    history: [{ at: erpNow(), action: 'opened', by: meta.user || 'student' }],
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.disputes, dispute);
  if (payload.orderId) mutateOrder(payload.orderId, 'request_refund', { reason: dispute.subject }, meta);
  publishLive({ type: 'dispute.created', id: dispute.id });
  return { ok: true, dispute };
}

export function decideDispute(disputeId, payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  const dispute = erpActiveItems(erpReadCollection(COLLECTIONS.disputes).items).find((d) => d.id === disputeId);
  if (!dispute) return { ok: false, error: 'DISPUTE_NOT_FOUND' };
  const decision = payload.decision || 'refund';
  const history = [...(dispute.history || []), { at: erpNow(), action: 'decided', by: meta.user || 'owner', decision }];
  const updated = updateItem(COLLECTIONS.disputes, disputeId, {
    status: 'resolved',
    decision,
    decidedBy: meta.user || 'owner',
    history,
  });
  if (decision === 'refund' && dispute.orderId) mutateOrder(dispute.orderId, 'refund', {}, meta);
  publishLive({ type: 'dispute.resolved', id: disputeId, decision });
  return { ok: true, dispute: updated };
}

export function getMarketplaceAnalytics() {
  ensureMarketplaceEngine();
  const listings = erpActiveItems(erpReadCollection(COLLECTIONS.listings).items);
  const orders = erpActiveItems(erpReadCollection(COLLECTIONS.orders).items);
  const bookings = erpActiveItems(erpReadCollection(COLLECTIONS.bookings).items);
  const reviews = erpActiveItems(erpReadCollection(COLLECTIONS.reviews).items);

  const revenue = money(orders.filter((o) => ['confirmed', 'completed'].includes(o.status)).reduce((s, o) => s + Number(o.total || 0), 0));
  const sales = orders.filter((o) => ['confirmed', 'completed'].includes(o.status)).length;
  const conversionRate = bookings.length ? money((sales / Math.max(bookings.length, 1)) * 100) : 0;
  const satisfaction = reviews.length ? money(reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length) : 0;

  const topBy = (type) =>
    [...listings]
      .filter((l) => !type || l.listingType === type)
      .sort((a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0) || Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 10)
      .map((l) => ({ id: l.id, title: l.title, listingType: l.listingType, salesCount: l.salesCount || 0, rating: l.rating || 0, revenue: money((l.salesCount || 0) * Number(l.price || 0)) }));

  return {
    ok: true,
    generatedAt: erpNow(),
    kpis: {
      sales,
      revenue,
      bookings: bookings.length,
      conversionRate,
      customerSatisfaction: satisfaction,
      listings: listings.length,
      verifiedProviders: listings.filter((l) => l.verified).length,
    },
    topServices: topBy(),
    topTeachers: topBy('teacher'),
    topSchools: topBy('school'),
    topUniversities: topBy('university'),
    topCenters: topBy('educational_center'),
    topEmployers: topBy('employer'),
  };
}

export function getMarketplaceDashboard() {
  ensureMarketplaceEngine();
  const listings = erpActiveItems(erpReadCollection(COLLECTIONS.listings).items);
  const availability = erpActiveItems(erpReadCollection(COLLECTIONS.availability).items);
  const bookings = erpActiveItems(erpReadCollection(COLLECTIONS.bookings).items);
  const carts = erpActiveItems(erpReadCollection(COLLECTIONS.carts).items);
  const orders = erpActiveItems(erpReadCollection(COLLECTIONS.orders).items);
  const reviews = erpActiveItems(erpReadCollection(COLLECTIONS.reviews).items);
  const subscriptions = erpActiveItems(erpReadCollection(COLLECTIONS.subscriptions).items);
  const coupons = erpActiveItems(erpReadCollection(COLLECTIONS.coupons).items);
  const giftCards = erpActiveItems(erpReadCollection(COLLECTIONS.giftCards).items);
  const affiliates = erpActiveItems(erpReadCollection(COLLECTIONS.affiliates).items);
  const referrals = erpActiveItems(erpReadCollection(COLLECTIONS.referrals).items);
  const loyalty = erpActiveItems(erpReadCollection(COLLECTIONS.loyalty).items);
  const disputes = erpActiveItems(erpReadCollection(COLLECTIONS.disputes).items);
  const fraud = erpActiveItems(erpReadCollection(COLLECTIONS.fraud).items);
  const auditLog = erpActiveItems(erpReadCollection(COLLECTIONS.audit).items).slice(0, 100);
  const analytics = getMarketplaceAnalytics();
  const recommendations = recommendListings({ limit: 8 }, { user: 'owner' });

  return {
    ok: true,
    generatedAt: erpNow(),
    config: getMarketConfig(),
    catalog: {
      listingTypes: MARKET_LISTING_TYPES,
      bookingTypes: MARKET_BOOKING_TYPES,
      orderStatuses: MARKET_ORDER_STATUSES,
      deliveryModes: MARKET_DELIVERY_MODES,
      subscriptionPlans: MARKET_SUBSCRIPTION_PLANS,
      searchFilters: MARKET_SEARCH_FILTERS,
      paymentMethods: PAYOUT_METHODS,
    },
    stats: {
      listings: listings.length,
      verified: listings.filter((l) => l.verified).length,
      bookings: bookings.length,
      openCarts: carts.filter((c) => c.status === 'open').length,
      orders: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      reviews: reviews.length,
      subscriptions: subscriptions.filter((s) => s.status === 'active').length,
      disputesOpen: disputes.filter((d) => d.status === 'open').length,
      fraudFlags: fraud.length,
      revenue: analytics.kpis.revenue,
    },
    listings: listings.slice(0, 200),
    availability: availability.slice(0, 200),
    bookings: bookings.slice(0, 200),
    carts: carts.slice(0, 50),
    orders: orders.slice(0, 200),
    reviews: reviews.slice(0, 200),
    subscriptions: subscriptions.slice(0, 100),
    coupons,
    giftCards,
    affiliates,
    referrals: referrals.slice(0, 100),
    loyalty: loyalty.slice(0, 100),
    disputes: disputes.slice(0, 100),
    fraud: fraud.slice(0, 100),
    analytics,
    recommendations: recommendations.items,
    audit: auditLog,
    liveVersion: liveBus().version,
    lastLiveEvent: liveBus().last,
  };
}

export async function mutateMarketplaceCenter(action, payload = {}, meta = {}) {
  ensureMarketplaceEngine();
  switch (action) {
    case 'syncListings':
      return syncListingsFromErp(meta);
    case 'search':
      return searchMarketplace(payload);
    case 'upsertAvailability':
      return upsertAvailability(payload, meta);
    case 'createBooking':
      return createBooking(payload, meta);
    case 'addToCart':
      return addToCart(payload, meta);
    case 'applyPromo':
      return applyCartPromo(payload, meta);
    case 'checkout':
      return checkoutCart(payload, meta);
    case 'orderAction':
      return mutateOrder(payload.id || payload.orderId, payload.orderAction || payload.op, payload, meta);
    case 'createReview':
      return createReview(payload, meta);
    case 'reviewAction':
      return mutateReview(payload.id || payload.reviewId, payload.reviewAction || payload.op, payload, meta);
    case 'createSubscription':
      return createSubscription(payload, meta);
    case 'recommend':
      return recommendListings(payload, meta);
    case 'createDispute':
      return createDispute(payload, meta);
    case 'decideDispute':
      return decideDispute(payload.id || payload.disputeId, payload, meta);
    case 'createListing': {
      const listing = {
        id: erpId(),
        key: payload.key || `listing_${Date.now()}`,
        title: erpText(payload.title) || 'Listing',
        titleAr: payload.titleAr || payload.title,
        listingType: payload.listingType || 'future_service',
        bookingType: payload.bookingType || 'online_service',
        providerId: payload.providerId || meta.user || 'owner',
        providerRole: payload.providerRole || 'owner',
        price: Number(payload.price || 0),
        currency: payload.currency || getMarketConfig().defaultCurrency,
        country: payload.country || 'Jordan',
        city: payload.city || null,
        language: payload.language || 'ar',
        subject: payload.subject || null,
        deliveryMode: MARKET_DELIVERY_MODES.includes(payload.deliveryMode) ? payload.deliveryMode : 'online',
        rating: 0,
        experienceYears: Number(payload.experienceYears || 0),
        certification: Boolean(payload.certification),
        verified: Boolean(payload.verified ?? true),
        status: 'active',
        salesCount: 0,
        bookingCount: 0,
        qualityScore: 0,
        createdAt: erpNow(),
        updatedAt: erpNow(),
      };
      pushItem(COLLECTIONS.listings, listing);
      publishLive({ type: 'listing.created', id: listing.id });
      return { ok: true, listing };
    }
    case 'createAffiliate': {
      const affiliate = {
        id: erpId(),
        code: erpText(payload.code) || `REF${Date.now().toString().slice(-6)}`,
        ownerId: meta.user || 'partner',
        earnings: 0,
        conversions: 0,
        status: 'active',
        createdAt: erpNow(),
        updatedAt: erpNow(),
      };
      pushItem(COLLECTIONS.affiliates, affiliate);
      return { ok: true, affiliate };
    }
    case 'setConfig':
      return setMarketConfig(payload, meta);
    case 'analytics':
      return getMarketplaceAnalytics();
    default:
      return { ok: false, error: 'UNKNOWN_MARKET_ACTION' };
  }
}

export const MARKETPLACE_MODULE_IDS = Object.freeze([
  'global-marketplace',
  'market-listings',
  'market-bookings',
  'market-availability',
  'market-search',
  'market-cart',
  'market-orders',
  'market-reviews',
  'market-subscriptions',
  'market-affiliates',
  'market-disputes',
  'market-analytics',
  'market-security',
]);
