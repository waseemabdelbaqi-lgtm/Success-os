'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة' },
  { id: 'marketplace', label: 'Marketplace', labelAr: 'السوق' },
  { id: 'booking', label: 'Booking', labelAr: 'الحجز' },
  { id: 'availability', label: 'Availability', labelAr: 'التوفر' },
  { id: 'search', label: 'Search', labelAr: 'بحث' },
  { id: 'cart', label: 'Cart & Checkout', labelAr: 'السلة والدفع' },
  { id: 'orders', label: 'Orders', labelAr: 'الطلبات' },
  { id: 'reviews', label: 'Reviews', labelAr: 'التقييمات' },
  { id: 'subscriptions', label: 'Subscriptions', labelAr: 'الاشتراكات' },
  { id: 'recommend', label: 'Recommendations', labelAr: 'التوصيات' },
  { id: 'affiliates', label: 'Affiliates', labelAr: 'التسويق بالعمولة' },
  { id: 'disputes', label: 'Disputes', labelAr: 'النزاعات' },
  { id: 'analytics', label: 'Analytics', labelAr: 'التحليلات' },
  { id: 'security', label: 'Security', labelAr: 'الأمان' },
];

function Stat({ label, value }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '0.85rem', background: 'var(--ea-card, #fff)' }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{value ?? '—'}</div>
    </div>
  );
}

function Panel({ title, children, actions }) {
  return (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, background: 'var(--ea-card, #fff)', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>
      </div>
      {children}
    </section>
  );
}

function Table({ columns, rows, empty = 'No rows' }) {
  if (!rows?.length) return <p style={{ color: '#6b7280', margin: 0 }}>{empty}</p>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: 'start', borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || row.key || idx}>
              {columns.map((c) => (
                <td key={c.key} style={{ borderBottom: '1px solid #f3f4f6', padding: '8px 6px', verticalAlign: 'top' }}>
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EnterpriseMarketplaceCenter() {
  const [lang, setLang] = useState('ar');
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [searchFilters, setSearchFilters] = useState({ q: '', country: '', subject: '', deliveryMode: '', ratingMin: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedListing, setSelectedListing] = useState('');

  const isAr = lang === 'ar';

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/marketplace?view=dashboard', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load marketplace');
    const json = await res.json();
    setData(json);
    if (!selectedListing && json.listings?.[0]?.id) setSelectedListing(json.listings[0].id);
  }, [selectedListing]);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource('/api/marketplace?view=stream');
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          setLive(true);
          if (payload.dashboard) setData(payload.dashboard);
          else if (payload.stats) setData((prev) => (prev ? { ...prev, stats: { ...prev.stats, ...payload.stats } } : prev));
          if (payload.type === 'live') load().catch(() => {});
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => setLive(false);
    } catch {
      /* ignore */
    }
    return () => {
      try {
        es?.close();
      } catch {
        /* ignore */
      }
    };
  }, [load]);

  async function run(action, payload = {}) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, user: 'owner', role: 'owner' }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'action failed');
      if (action === 'search') setSearchResults(json.items || []);
      await load();
      return json;
    } catch (e) {
      setError(e.message || 'action failed');
      return null;
    } finally {
      setBusy(false);
    }
  }

  const t = useMemo(
    () => ({
      title: isAr ? 'السوق العالمي والحجز والتجارة' : 'Global Marketplace, Booking & Commerce',
      subtitle: isAr
        ? 'عرض، حجز، دفع، تقييم وإدارة كل الخدمات التعليمية من سوق موحّد — مربوط بالمالية والعمولات دون تكرار البيانات.'
        : 'List, book, pay, review and manage every educational service from one marketplace — wired to finance & commissions with no duplicated data.',
      live: isAr ? 'تحديث مباشر' : 'Live updates',
      offline: isAr ? 'غير متصل' : 'Offline',
    }),
    [isAr],
  );

  const stats = data?.stats || {};
  const openCart = (data?.carts || []).find((c) => c.status === 'open');

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>{t.title}</h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280', maxWidth: 780 }}>{t.subtitle}</p>
          <div style={{ marginTop: 8, fontSize: 12, color: live ? '#047857' : '#b45309' }}>
            {live ? t.live : t.offline}
            {data?.generatedAt ? ` · ${data.generatedAt}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ padding: '8px 10px', borderRadius: 10 }}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
          <button type="button" disabled={busy} onClick={() => load()}>
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
          <button type="button" disabled={busy} onClick={() => run('syncListings')}>
            {isAr ? 'مزامنة من ERP' : 'Sync from ERP'}
          </button>
        </div>
      </div>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14 }}>
        <Stat label={isAr ? 'العروض' : 'Listings'} value={stats.listings} />
        <Stat label={isAr ? 'موثّقون' : 'Verified'} value={stats.verified} />
        <Stat label={isAr ? 'حجوزات' : 'Bookings'} value={stats.bookings} />
        <Stat label={isAr ? 'طلبات' : 'Orders'} value={stats.orders} />
        <Stat label={isAr ? 'إيراد' : 'Revenue'} value={stats.revenue} />
        <Stat label={isAr ? 'اشتراكات' : 'Subs'} value={stats.subscriptions} />
        <Stat label={isAr ? 'نزاعات' : 'Disputes'} value={stats.disputesOpen} />
        <Stat label={isAr ? 'احتيال' : 'Fraud'} value={stats.fraudFlags} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            style={{
              borderRadius: 999,
              border: tab === item.id ? '1px solid #0f766e' : '1px solid #e5e7eb',
              background: tab === item.id ? '#ecfdf5' : '#fff',
              color: tab === item.id ? '#065f46' : '#111827',
              padding: '8px 12px',
              fontWeight: tab === item.id ? 700 : 500,
            }}
          >
            {isAr ? item.labelAr : item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <Panel title={isAr ? 'أنواع العروض المدعومة' : 'Supported listing types'}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(data?.catalog?.listingTypes || []).map((t) => (
              <span key={t.key} style={{ border: '1px solid #d1d5db', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>
                {isAr ? t.labelAr : t.label}
              </span>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === 'marketplace' ? (
        <Panel
          title={isAr ? 'عروض السوق' : 'Marketplace listings'}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run('createListing', {
                  title: isAr ? 'خدمة جديدة' : 'New service',
                  listingType: 'future_service',
                  price: 29,
                  deliveryMode: 'online',
                  verified: true,
                })
              }
            >
              {isAr ? 'إضافة عرض' : 'Add listing'}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'title', label: isAr ? 'العنوان' : 'Title', render: (r) => (isAr ? r.titleAr || r.title : r.title) },
              { key: 'listingType', label: isAr ? 'النوع' : 'Type' },
              { key: 'price', label: isAr ? 'السعر' : 'Price' },
              { key: 'country', label: isAr ? 'الدولة' : 'Country' },
              { key: 'deliveryMode', label: isAr ? 'التسليم' : 'Mode' },
              { key: 'rating', label: isAr ? 'التقييم' : 'Rating' },
              { key: 'verified', label: isAr ? 'موثّق' : 'Verified', render: (r) => (r.verified ? (isAr ? 'نعم' : 'Yes') : '—') },
              {
                key: 'pick',
                label: isAr ? 'اختيار' : 'Select',
                render: (r) => (
                  <button type="button" onClick={() => setSelectedListing(r.id)}>
                    {selectedListing === r.id ? '✓' : isAr ? 'اختر' : 'Select'}
                  </button>
                ),
              },
            ]}
            rows={data?.listings || []}
          />
        </Panel>
      ) : null}

      {tab === 'booking' ? (
        <Panel
          title={isAr ? 'محرك الحجز' : 'Booking engine'}
          actions={
            <button
              type="button"
              disabled={busy || !selectedListing}
              onClick={() =>
                run('createBooking', {
                  listingId: selectedListing,
                  slotDate: new Date().toISOString().slice(0, 10),
                  slotTime: '10:00',
                  bookingType: 'private_lesson',
                })
              }
            >
              {isAr ? 'حجز الآن' : 'Book now'}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'listingTitle', label: isAr ? 'الخدمة' : 'Service' },
              { key: 'bookingType', label: isAr ? 'نوع الحجز' : 'Type' },
              { key: 'slotDate', label: isAr ? 'التاريخ' : 'Date' },
              { key: 'slotTime', label: isAr ? 'الوقت' : 'Time' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'price', label: isAr ? 'السعر' : 'Price' },
              {
                key: 'cart',
                label: isAr ? 'السلة' : 'Cart',
                render: (r) => (
                  <button type="button" disabled={busy} onClick={() => run('addToCart', { listingId: r.listingId, bookingId: r.id })}>
                    {isAr ? 'أضف' : 'Add'}
                  </button>
                ),
              },
            ]}
            rows={data?.bookings || []}
          />
        </Panel>
      ) : null}

      {tab === 'availability' ? (
        <Panel title={isAr ? 'محرك التوفر' : 'Availability engine'}>
          <Table
            columns={[
              { key: 'listingId', label: isAr ? 'العرض' : 'Listing' },
              { key: 'timezone', label: isAr ? 'المنطقة' : 'Timezone' },
              {
                key: 'workingHours',
                label: isAr ? 'ساعات العمل' : 'Hours',
                render: (r) => `${r.workingHours?.start || '—'}–${r.workingHours?.end || '—'}`,
              },
              {
                key: 'availableDays',
                label: isAr ? 'الأيام' : 'Days',
                render: (r) => (r.availableDays || []).join(', '),
              },
              {
                key: 'timeSlots',
                label: isAr ? 'الفترات' : 'Slots',
                render: (r) => (r.timeSlots || []).join(', '),
              },
              { key: 'maxDailyBookings', label: isAr ? 'حد يومي' : 'Max/day' },
            ]}
            rows={data?.availability || []}
          />
        </Panel>
      ) : null}

      {tab === 'search' ? (
        <Panel
          title={isAr ? 'بحث متقدم' : 'Advanced search'}
          actions={
            <button type="button" disabled={busy} onClick={() => run('search', searchFilters)}>
              {isAr ? 'بحث' : 'Search'}
            </button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8, marginBottom: 12 }}>
            {['q', 'country', 'subject', 'deliveryMode', 'ratingMin'].map((key) => (
              <input
                key={key}
                value={searchFilters[key] || ''}
                onChange={(e) => setSearchFilters((s) => ({ ...s, [key]: e.target.value }))}
                placeholder={key}
                style={{ padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            ))}
          </div>
          <Table
            columns={[
              { key: 'title', label: isAr ? 'العنوان' : 'Title' },
              { key: 'listingType', label: isAr ? 'النوع' : 'Type' },
              { key: 'price', label: isAr ? 'السعر' : 'Price' },
              { key: 'country', label: isAr ? 'الدولة' : 'Country' },
              { key: 'rating', label: isAr ? 'التقييم' : 'Rating' },
              { key: 'deliveryMode', label: isAr ? 'الوضع' : 'Mode' },
            ]}
            rows={searchResults}
            empty={isAr ? 'نفّذ بحثًا لعرض النتائج' : 'Run a search to see results'}
          />
        </Panel>
      ) : null}

      {tab === 'cart' ? (
        <Panel
          title={isAr ? 'السلة والدفع' : 'Cart & checkout'}
          actions={
            <>
              <button type="button" disabled={busy} onClick={() => run('applyPromo', { couponCode: 'WELCOME10' })}>
                WELCOME10
              </button>
              <button type="button" disabled={busy} onClick={() => run('applyPromo', { giftCardCode: 'GIFT50' })}>
                GIFT50
              </button>
              <button
                type="button"
                disabled={busy || !(openCart?.items || []).length}
                onClick={() => run('checkout', { paymentMethod: 'manual_transfer', affiliateCode: 'AFF001' })}
              >
                {isAr ? 'إتمام الشراء' : 'Checkout'}
              </button>
            </>
          }
        >
          <p style={{ color: '#6b7280', fontSize: 13 }}>
            {isAr
              ? `عناصر السلة: ${(openCart?.items || []).length} · كوبون: ${openCart?.couponCode || '—'} · بطاقة هدية: ${openCart?.giftCardCode || '—'}`
              : `Cart items: ${(openCart?.items || []).length} · Coupon: ${openCart?.couponCode || '—'} · Gift card: ${openCart?.giftCardCode || '—'}`}
          </p>
          <Table
            columns={[
              { key: 'title', label: isAr ? 'العنصر' : 'Item' },
              { key: 'price', label: isAr ? 'السعر' : 'Price' },
              { key: 'quantity', label: isAr ? 'الكمية' : 'Qty' },
            ]}
            rows={openCart?.items || []}
            empty={isAr ? 'السلة فارغة — أضف من الحجوزات' : 'Cart empty — add from bookings'}
          />
          <h4 style={{ margin: '16px 0 8px' }}>{isAr ? 'كوبونات / بطاقات هدية' : 'Coupons / gift cards'}</h4>
          <Table
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'type', label: isAr ? 'النوع' : 'Type', render: (r) => r.type || 'gift' },
              { key: 'value', label: isAr ? 'القيمة' : 'Value', render: (r) => r.value ?? r.balance },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
            ]}
            rows={[...(data?.coupons || []), ...(data?.giftCards || [])]}
          />
        </Panel>
      ) : null}

      {tab === 'orders' ? (
        <Panel title={isAr ? 'إدارة الطلبات' : 'Order management'}>
          <Table
            columns={[
              { key: 'number', label: isAr ? 'الرقم' : 'Number' },
              { key: 'total', label: isAr ? 'الإجمالي' : 'Total' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'paymentMethod', label: isAr ? 'الدفع' : 'Payment' },
              { key: 'fraudScore', label: isAr ? 'احتيال' : 'Fraud' },
              {
                key: 'actions',
                label: isAr ? 'إجراءات' : 'Actions',
                render: (row) => (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['confirm', 'complete', 'cancel', 'request_refund', 'refund'].map((op) => (
                      <button key={op} type="button" disabled={busy} onClick={() => run('orderAction', { id: row.id, orderAction: op })}>
                        {op}
                      </button>
                    ))}
                  </div>
                ),
              },
            ]}
            rows={data?.orders || []}
          />
        </Panel>
      ) : null}

      {tab === 'reviews' ? (
        <Panel
          title={isAr ? 'نظام التقييمات' : 'Review system'}
          actions={
            <button
              type="button"
              disabled={busy || !selectedListing}
              onClick={() => run('createReview', { listingId: selectedListing, rating: 5, comment: isAr ? 'خدمة ممتازة' : 'Excellent service', orderId: data?.orders?.[0]?.id })}
            >
              {isAr ? 'تقييم' : 'Review'}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'listingId', label: isAr ? 'العرض' : 'Listing' },
              { key: 'rating', label: isAr ? 'التقييم' : 'Rating' },
              { key: 'comment', label: isAr ? 'تعليق' : 'Comment' },
              { key: 'verified', label: isAr ? 'موثّق' : 'Verified', render: (r) => (r.verified ? (isAr ? 'نعم' : 'Yes') : '—') },
              { key: 'providerReply', label: isAr ? 'رد المزود' : 'Reply' },
              {
                key: 'actions',
                label: isAr ? 'إجراء' : 'Action',
                render: (row) => (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" disabled={busy} onClick={() => run('reviewAction', { id: row.id, reviewAction: 'reply', reply: 'Thank you!' })}>
                      {isAr ? 'رد' : 'Reply'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => run('reviewAction', { id: row.id, reviewAction: 'report', reason: 'abuse' })}>
                      {isAr ? 'بلاغ' : 'Report'}
                    </button>
                  </div>
                ),
              },
            ]}
            rows={data?.reviews || []}
          />
        </Panel>
      ) : null}

      {tab === 'subscriptions' ? (
        <Panel
          title={isAr ? 'الاشتراكات' : 'Subscriptions'}
          actions={
            <>
              {(data?.catalog?.subscriptionPlans || []).map((p) => (
                <button key={p.key} type="button" disabled={busy} onClick={() => run('createSubscription', { plan: p.key, price: 29, listingId: selectedListing || null })}>
                  {p.label}
                </button>
              ))}
            </>
          }
        >
          <Table
            columns={[
              { key: 'plan', label: isAr ? 'الخطة' : 'Plan' },
              { key: 'userId', label: isAr ? 'المستخدم' : 'User' },
              { key: 'price', label: isAr ? 'السعر' : 'Price' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'startsAt', label: isAr ? 'البداية' : 'Starts' },
              { key: 'endsAt', label: isAr ? 'النهاية' : 'Ends' },
            ]}
            rows={data?.subscriptions || []}
          />
        </Panel>
      ) : null}

      {tab === 'recommend' ? (
        <Panel
          title={isAr ? 'محرك التوصيات' : 'Recommendation engine'}
          actions={<button type="button" disabled={busy} onClick={() => run('recommend', { interests: ['teacher', 'course'], location: 'Jordan', goals: ['exam'] })}>{isAr ? 'تحديث التوصيات' : 'Refresh recommendations'}</button>}
        >
          <Table
            columns={[
              { key: 'title', label: isAr ? 'الخدمة' : 'Service' },
              { key: 'listingType', label: isAr ? 'النوع' : 'Type' },
              { key: 'recommendScore', label: isAr ? 'النقاط' : 'Score' },
              { key: 'rating', label: isAr ? 'التقييم' : 'Rating' },
              { key: 'country', label: isAr ? 'الدولة' : 'Country' },
            ]}
            rows={data?.recommendations || []}
          />
        </Panel>
      ) : null}

      {tab === 'affiliates' ? (
        <Panel
          title={isAr ? 'التسويق بالعمولة والإحالات' : 'Affiliate & referral'}
          actions={<button type="button" disabled={busy} onClick={() => run('createAffiliate', { code: `AFF${Date.now().toString().slice(-4)}` })}>{isAr ? 'إنشاء كود' : 'Create code'}</button>}
        >
          <Table
            columns={[
              { key: 'code', label: isAr ? 'الكود' : 'Code' },
              { key: 'ownerId', label: isAr ? 'المالك' : 'Owner' },
              { key: 'earnings', label: isAr ? 'الأرباح' : 'Earnings' },
              { key: 'conversions', label: isAr ? 'التحويلات' : 'Conversions' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
            ]}
            rows={data?.affiliates || []}
          />
          <h4 style={{ margin: '16px 0 8px' }}>{isAr ? 'تتبع الإحالات' : 'Referral tracking'}</h4>
          <Table
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'orderId', label: isAr ? 'الطلب' : 'Order' },
              { key: 'commission', label: isAr ? 'العمولة' : 'Commission' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
            ]}
            rows={data?.referrals || []}
          />
          <h4 style={{ margin: '16px 0 8px' }}>{isAr ? 'نقاط الولاء' : 'Loyalty points'}</h4>
          <Table
            columns={[
              { key: 'userId', label: isAr ? 'المستخدم' : 'User' },
              { key: 'points', label: isAr ? 'النقاط' : 'Points' },
              { key: 'orderId', label: isAr ? 'الطلب' : 'Order' },
            ]}
            rows={data?.loyalty || []}
          />
        </Panel>
      ) : null}

      {tab === 'disputes' ? (
        <Panel
          title={isAr ? 'مركز النزاعات' : 'Dispute center'}
          actions={
            <button
              type="button"
              disabled={busy || !(data?.orders || []).length}
              onClick={() =>
                run('createDispute', {
                  orderId: data.orders[0].id,
                  subject: isAr ? 'شكوى جودة' : 'Quality complaint',
                  body: isAr ? 'الخدمة لم تكن كما هو متوقع' : 'Service not as expected',
                  evidence: ['screenshot.png'],
                })
              }
            >
              {isAr ? 'فتح نزاع' : 'Open dispute'}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'subject', label: isAr ? 'الموضوع' : 'Subject' },
              { key: 'orderId', label: isAr ? 'الطلب' : 'Order' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'decision', label: isAr ? 'القرار' : 'Decision' },
              {
                key: 'actions',
                label: isAr ? 'قرار إداري' : 'Admin decision',
                render: (row) =>
                  row.status === 'open' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" disabled={busy} onClick={() => run('decideDispute', { id: row.id, decision: 'refund' })}>
                        {isAr ? 'استرداد' : 'Refund'}
                      </button>
                      <button type="button" disabled={busy} onClick={() => run('decideDispute', { id: row.id, decision: 'reject' })}>
                        {isAr ? 'رفض' : 'Reject'}
                      </button>
                    </div>
                  ) : (
                    row.decision || '—'
                  ),
              },
            ]}
            rows={data?.disputes || []}
          />
        </Panel>
      ) : null}

      {tab === 'analytics' ? (
        <Panel title={isAr ? 'تحليلات السوق' : 'Marketplace analytics'}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 14 }}>
            {Object.entries(data?.analytics?.kpis || {}).map(([k, v]) => (
              <Stat key={k} label={k} value={v} />
            ))}
          </div>
          {['topServices', 'topTeachers', 'topSchools', 'topUniversities', 'topCenters', 'topEmployers'].map((key) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <h4 style={{ margin: '0 0 8px' }}>{key}</h4>
              <Table
                columns={[
                  { key: 'title', label: isAr ? 'الاسم' : 'Name' },
                  { key: 'listingType', label: isAr ? 'النوع' : 'Type' },
                  { key: 'salesCount', label: isAr ? 'المبيعات' : 'Sales' },
                  { key: 'rating', label: isAr ? 'التقييم' : 'Rating' },
                  { key: 'revenue', label: isAr ? 'الإيراد' : 'Revenue' },
                ]}
                rows={data?.analytics?.[key] || []}
              />
            </div>
          ))}
        </Panel>
      ) : null}

      {tab === 'security' ? (
        <Panel title={isAr ? 'الأمان ومراقبة المعاملات' : 'Security & transaction monitoring'}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 14 }}>
            {Object.entries(data?.config || {}).map(([key, value]) => (
              <label key={key} style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 4 }}>{key}</div>
                <input
                  defaultValue={String(value ?? '')}
                  disabled={busy || key === 'updatedAt' || key === 'updatedBy'}
                  onBlur={(e) => {
                    if (key === 'updatedAt' || key === 'updatedBy') return;
                    const raw = e.target.value;
                    const parsed = raw === 'true' ? true : raw === 'false' ? false : Number.isFinite(Number(raw)) && raw !== '' ? Number(raw) : raw;
                    run('setConfig', { [key]: parsed });
                  }}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
                />
              </label>
            ))}
          </div>
          <h4 style={{ margin: '0 0 8px' }}>{isAr ? 'أحداث الاحتيال' : 'Fraud events'}</h4>
          <Table
            columns={[
              { key: 'orderId', label: isAr ? 'الطلب' : 'Order' },
              { key: 'score', label: isAr ? 'النقاط' : 'Score' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'createdAt', label: isAr ? 'التاريخ' : 'At' },
            ]}
            rows={data?.fraud || []}
            empty={isAr ? 'لا أحداث احتيال' : 'No fraud events'}
          />
          <h4 style={{ margin: '16px 0 8px' }}>{isAr ? 'سجل التدقيق' : 'Audit log'}</h4>
          <Table
            columns={[
              { key: 'action', label: isAr ? 'الإجراء' : 'Action' },
              { key: 'user', label: isAr ? 'المستخدم' : 'User' },
              { key: 'at', label: isAr ? 'الوقت' : 'At' },
            ]}
            rows={data?.audit || []}
          />
        </Panel>
      ) : null}
    </div>
  );
}

export default EnterpriseMarketplaceCenter;
