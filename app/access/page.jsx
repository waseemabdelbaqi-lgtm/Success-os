"use client";
import { useEffect, useMemo, useState } from "react";
import { InnerNav } from "../components";

const portals = [
  ["student", "◉", "الطلاب", "تعلم، معلمون، مدارس وقبول جامعي"],
  ["teacher", "♙", "المعلمون", "شراكة، رفع شرح، حصص وأسعار"],
  ["center", "▦", "المراكز التعليمية", "معلمون، حصص، تسجيل محتوى"],
  ["school", "⌂", "المدارس", "النظام والصف والسعر السنوي"],
  ["university", "🎓", "الجامعات والكليات", "شروط القبول والتقديم"],
  ["employer", "↗", "شركات التوظيف", "وظائف وشروط واستقبال طلبات"],
  ["jobseeker", "◇", "الباحثون عن العمل", "ملف مهارات ووظائف وتقديم"],
];

const countrySystems = {
  الأردن: ["الوطني الأردني", "الأمريكي", "IGCSE / A Level", "IB", "BTEC"],
  مصر: ["الثانوية العامة", "النظام الأمريكي", "IGCSE", "IB", "EST / ACT"],
  الإمارات: [
    "وزارة التربية الإماراتية",
    "American Curriculum",
    "British Curriculum",
    "IB",
    "CBSE",
  ],
  السعودية: ["المنهج السعودي", "المسار الأمريكي", "المسار البريطاني", "IB"],
  قطر: ["المنهج القطري", "American Curriculum", "British Curriculum", "IB"],
  الكويت: ["المنهج الكويتي", "American Curriculum", "British Curriculum", "IB"],
  البحرين: [
    "المنهج البحريني",
    "American Curriculum",
    "British Curriculum",
    "IB",
  ],
  عمان: ["دبلوم التعليم العام", "American Curriculum", "Cambridge", "IB"],
  الجزائر: [
    "النظام الجزائري",
    "البكالوريا الفرنسية",
    "Cambridge International",
  ],
  المغرب: ["النظام المغربي", "البكالوريا الفرنسية", "المسار الدولي", "IB"],
  تونس: [
    "البكالوريا التونسية",
    "البكالوريا الفرنسية",
    "Cambridge International",
  ],
  تركيا: ["النظام التركي", "IB", "Cambridge International", "American Diploma"],
  "الولايات المتحدة": ["US High School Diploma", "AP", "IB", "Dual Enrollment"],
  كندا: ["Provincial Curriculum", "IB", "AP", "French Curriculum"],
  "المملكة المتحدة": ["GCSE", "A Level", "BTEC", "IB", "Scottish Curriculum"],
  ألمانيا: ["Abitur", "International Baccalaureate", "Cambridge International"],
  فرنسا: ["Baccalauréat Général", "Baccalauréat Technologique", "IB"],
  إسبانيا: ["Bachillerato", "IB", "British Curriculum"],
  إيطاليا: ["Liceo / Diploma", "IB", "Cambridge International"],
  هولندا: ["HAVO", "VWO", "MBO", "IB"],
  أستراليا: ["State Senior Certificate", "ATAR", "IB"],
  نيوزيلندا: ["NCEA", "Cambridge International", "IB"],
  الهند: ["CBSE", "CISCE / ISC", "State Board", "IB", "Cambridge"],
  باكستان: ["Matric / Intermediate", "Cambridge O/A Level", "IB"],
  ماليزيا: ["SPM / STPM", "Cambridge", "IB", "Australian Curriculum"],
  سنغافورة: ["Singapore-Cambridge", "IB", "Integrated Programme"],
  "جنوب أفريقيا": ["NSC", "IEB", "Cambridge International"],
  جورجيا: ["Georgian National Curriculum", "IB", "Cambridge International"],
  "دولة أخرى": [
    "النظام الوطني للدولة",
    "American Curriculum",
    "British Curriculum",
    "IB",
    "Cambridge International",
  ],
};
const isoCodes =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(
    " ",
  );
const regionNames = new Intl.DisplayNames(["ar"], { type: "region" });
const allCountries = [
  ...new Set(isoCodes.map((code) => regionNames.of(code)).filter(Boolean)),
].sort((a, b) => a.localeCompare(b, "ar"));
allCountries.forEach((country) => {
  if (!countrySystems[country])
    countrySystems[country] = [
      `النظام الوطني في ${country}`,
      "American Curriculum",
      "British Curriculum",
      "IB",
      "Cambridge International",
    ];
});

const grades = [
  "روضة",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "خريج",
];
const subjects = [
  "رياضيات",
  "فيزياء",
  "كيمياء",
  "أحياء",
  "لغة إنجليزية",
  "لغة عربية",
  "علوم",
  "حاسوب",
  "اقتصاد",
  "مادة أخرى",
];
const learningServices = [
  "حصص مسجلة",
  "أونلاين برايفت",
  "وجاهي برايفت",
  "وجاهي مجموعة",
  "أونلاين مجموعة",
];
const recordedSubjects = ["فيزياء", "كيمياء", "رياضيات"];

export default function AccessPage() {
  const [portal, setPortal] = useState("student"),
    [name, setName] = useState(""),
    [country, setCountry] = useState("الأردن"),
    [system, setSystem] = useState(countrySystems["الأردن"][0]),
    [grade, setGrade] = useState("11"),
    [subject, setSubject] = useState("فيزياء"),
    [searchFor, setSearchFor] = useState("معلم"),
    [searchScope, setSearchScope] = useState("داخل الدولة"),
    [targetCountry, setTargetCountry] = useState("الأردن"),
    [service, setService] = useState("حصص مسجلة"),
    [price, setPrice] = useState("25"),
    [submitted, setSubmitted] = useState(false),
    [aiRequest, setAiRequest] = useState(false),
    [aiLoading, setAiLoading] = useState(false),
    [aiResult, setAiResult] = useState(""),
    [aiMode, setAiMode] = useState("openai");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("portal");
    if (portals.some((x) => x[0] === p)) setPortal(p);
  }, []);
  const systems = countrySystems[country] || [
    `النظام الوطني في ${country}`,
    "American Curriculum",
    "British Curriculum",
    "IB",
    "Cambridge International",
  ];
  const hasRecorded = recordedSubjects.includes(subject);
  const needsLearningFields =
    portal === "student" && ["معلم", "مركز تعليمي"].includes(searchFor);
  const supportsLocationChoice =
    (portal === "student" &&
      ["معلم", "مدرسة", "جامعة أو كلية", "شركة توظيف"].includes(
        searchFor,
      )) ||
    portal === "jobseeker";
  const effectiveSearchCountry =
    searchScope === "داخل الدولة" ? country : targetCountry;
  const title = portals.find((x) => x[0] === portal)?.[2];
  function changeCountry(v) {
    setCountry(v);
    if (searchScope === "داخل الدولة") setTargetCountry(v);
    setSystem(
      (countrySystems[v] || [
        `النظام الوطني في ${v}`,
        "American Curriculum",
        "British Curriculum",
        "IB",
        "Cambridge International",
      ])[0],
    );
    setSubmitted(false);
  }
  function changePortal(v) {
    setPortal(v);
    setSubmitted(false);
    setAiRequest(false);
  }
  async function runAI(action) {
    setAiLoading(true);
    setAiResult("");
    try {
      const response = await fetch("/api/ai-journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          portal,
          country,
          targetCountry: effectiveSearchCountry,
          searchScope,
          searchFor,
          system,
          grade,
          subject,
          service,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAiResult(data.text);
      setAiMode(data.mode || "openai");
      if (action === "recorded_lesson") {
        setAiRequest(true);
        const project = {
          id: `S4S-${Date.now().toString().slice(-7)}`,
          subject,
          grade,
          system,
          country: effectiveSearchCountry,
          plan: data.text,
          status: "بانتظار مراجعة معلم المادة",
          protection: "مشاهدة داخل SUCCESS OS فقط",
          createdAt: new Date().toISOString(),
        };
        const saved = JSON.parse(
          window.localStorage.getItem("success-os-production-queue") || "[]",
        );
        window.localStorage.setItem(
          "success-os-production-queue",
          JSON.stringify([project, ...saved].slice(0, 12)),
        );
      }
    } catch (error) {
      setAiResult(error.message || "تعذر تشغيل المساعد الآن.");
    } finally {
      setAiLoading(false);
    }
  }
  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    runAI("journey");
    const intent =
      new URLSearchParams(window.location.search).get("intent") || "search";
    const destinations = {
      student: "/student-portal",
      teacher: intent === "join" ? "/teacher-portal" : "/teachers",
      center: intent === "join" ? "/join-us?role=center" : "/centers",
      school: intent === "join" ? "/join-us?role=school" : "/schools",
      university:
        intent === "join" ? "/join-us?role=university" : "/universities",
      employer: intent === "join" ? "/join-us?role=employer" : "/jobs",
      jobseeker: "/jobseeker-portal",
    };
    const dest = destinations[portal] || "/start-journey";
    try {
      const payload = {
        portal,
        intent,
        name,
        country,
        system,
        grade,
        subject,
        at: new Date().toISOString(),
      };
      const saved = JSON.parse(
        window.localStorage.getItem("success-os-access-requests") || "[]",
      );
      window.localStorage.setItem(
        "success-os-access-requests",
        JSON.stringify([payload, ...saved].slice(0, 30)),
      );
    } catch {}
    window.setTimeout(() => {
      window.location.href = dest;
    }, 700);
  }
  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="access" />
      <main className="os-page-content portal-world">
        <header className="gateway-title">
          <span>SUCCESS OS GLOBAL GATEWAY</span>
          <h1>سبع بوابات، منظومة واحدة حول الإنسان</h1>
          <p>
            اختر دورك وشاهد رحلة مترابطة بدون اسم مستخدم أو كلمة مرور. التحقق
            والحسابات الخاصة تضاف في مرحلة الإنتاج.
          </p>
          <div className="language-row">
            <b>العربية</b>
            <span>English</span>
            <span>Français</span>
            <span>Türkçe</span>
            <span>Deutsch</span>
            <span>Español</span>
          </div>
        </header>
        <section className="seven-portals">
          {portals.map(([id, icon, label, text]) => (
            <button
              className={portal === id ? "active" : ""}
              key={id}
              onClick={() => changePortal(id)}
            >
              <span>{icon}</span>
              <b>{label}</b>
              <small>{text}</small>
            </button>
          ))}
        </section>
        <div className="portal-workspace">
          <aside>
            <small>البوابة الحالية</small>
            <h2>{title}</h2>
            <p>{portalCopy(portal)}</p>
            <div className="portal-steps">
              {stepsFor(portal).map((x, i) => (
                <div key={x}>
                  <b>{i + 1}</b>
                  <span>{x}</span>
                </div>
              ))}
            </div>
            <a
              href={
                portal === "university"
                  ? "/admissions"
                  : portal === "jobseeker"
                    ? "/jobseeker-portal"
                    : portal === "employer"
                    ? "/jobs"
                    : `/profile?role=${portal}`
              }
            >
              فتح المساحة المتخصصة ←
            </a>
          </aside>
          <form className="portal-form" onSubmit={submit}>
            <div className="form-section-title">
              <span>{portals.find((x) => x[0] === portal)?.[1]}</span>
              <div>
                <small>نموذج استكشاف</small>
                <h2>بيانات {title}</h2>
              </div>
            </div>
            <div className="smart-form-grid">
              <Field label="الاسم">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    portal === "student" ? "اكتب اسم الطالب" : "اسم الشخص أو الجهة"
                  }
                />
              </Field>
              <Field label="الدولة">
                <select
                  value={country}
                  onChange={(e) => changeCountry(e.target.value)}
                >
                  {Object.keys(countrySystems).map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              {!["employer", "jobseeker"].includes(portal) && (
                <Field label="النظام التعليمي">
                  <select
                    value={system}
                    onChange={(e) => setSystem(e.target.value)}
                  >
                    {systems.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
              )}
              {portal === "student" && (
                <Field label="أبحث عن">
                  <select
                    value={searchFor}
                    onChange={(e) => setSearchFor(e.target.value)}
                  >
                    {[
                      "معلم",
                      "مركز تعليمي",
                      "مدرسة",
                      "جامعة أو كلية",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
              )}
              {supportsLocationChoice && (
                <>
                  <Field label="نطاق البحث">
                    <select
                      value={searchScope}
                      onChange={(e) => {
                        setSearchScope(e.target.value);
                        if (e.target.value === "داخل الدولة")
                          setTargetCountry(country);
                      }}
                    >
                      <option>داخل الدولة</option>
                      <option>خارج الدولة</option>
                    </select>
                  </Field>
                  {searchScope === "خارج الدولة" && (
                    <Field label="الدولة التي تريد البحث فيها">
                      <select
                        value={targetCountry === country ? "دولة أخرى" : targetCountry}
                        onChange={(e) => setTargetCountry(e.target.value)}
                      >
                        {Object.keys(countrySystems)
                          .filter((x) => x !== country)
                          .map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                      </select>
                    </Field>
                  )}
                </>
              )}
              {(needsLearningFields ||
                ["teacher", "center", "school"].includes(portal)) && (
                <Field label="الصف">
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  >
                    {grades.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
              )}
              {(needsLearningFields ||
                ["teacher", "center"].includes(portal)) && (
                <Field label="المادة">
                  <select
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setAiRequest(false);
                    }}
                  >
                    {subjects.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
              )}
              {(needsLearningFields ||
                ["teacher", "center"].includes(portal)) && (
                <Field label="نوع الحصة أو الخدمة">
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                  >
                    {learningServices.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
              )}
              {["teacher", "center"].includes(portal) && (
                <Field label="السعر المقترح">
                  <div className="price-input">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    <span>JOD</span>
                  </div>
                </Field>
              )}
              {portal === "teacher" && (
                <Field label="رفع شرح أو حصة مسجلة">
                  <input type="file" accept="video/*,.pdf,.ppt,.pptx" />
                </Field>
              )}
              {portal === "center" && (
                <>
                  <Field label="اسم الدورة">
                    <input placeholder="مثال: تحليل البيانات للمبتدئين" />
                  </Field>
                  <Field label="نوع الشهادة">
                    <select defaultValue="بدون شهادة">
                      <option>بدون شهادة</option>
                      <option>شهادة حضور غير معتمدة</option>
                      <option>شهادة معتمدة من جهة مذكورة</option>
                    </select>
                  </Field>
                  <Field label="جهة الاعتماد ورقم الترخيص">
                    <input placeholder="إلزامي عند اختيار شهادة معتمدة" />
                  </Field>
                  <Field label="تسجيل ورفع حصص المركز">
                    <input type="file" accept="video/*,.pdf,.ppt,.pptx" />
                  </Field>
                  <p className="accreditation-rule">
                    لا يسمح بعرض كلمة «معتمدة» دون جهة اعتماد قابلة للتحقق ورقم
                    ترخيص أو رابط رسمي.
                  </p>
                </>
              )}
              {portal === "school" && (
                <>
                  <Field label="الصفوف المتاحة">
                    <input placeholder="مثال: الصف 1 إلى 12" />
                  </Field>
                  <Field label="السعر للسنة الدراسية">
                    <div className="price-input">
                      <input type="number" placeholder="السعر" />
                      <span>JOD</span>
                    </div>
                  </Field>
                </>
              )}
              {portal === "university" && (
                <>
                  <Field label="المدينة">
                    <input placeholder="المدينة أو الولاية" />
                  </Field>
                  <Field label="شروط القبول">
                    <textarea placeholder="الشهادة، المعدل، اللغة، الوثائق..." />
                  </Field>
                </>
              )}
              {portal === "employer" && (
                <>
                  <Field label="الوظيفة">
                    <input placeholder="المسمى الوظيفي" />
                  </Field>
                  <Field label="شروط الوظيفة">
                    <textarea placeholder="المؤهل، الخبرة، المهارات، الموقع..." />
                  </Field>
                </>
              )}
              {portal === "jobseeker" && (
                <>
                  <Field label="الوظيفة المطلوبة">
                    <input placeholder="المجال أو المسمى" />
                  </Field>
                  <Field label="المهارات والخبرة">
                    <textarea placeholder="اكتب خبرتك ومهاراتك الأساسية" />
                  </Field>
                  <Field label="السيرة الذاتية">
                    <input type="file" accept=".pdf,.doc,.docx" />
                  </Field>
                </>
              )}
            </div>
            {needsLearningFields && service === "حصص مسجلة" && (
              <div
                className={`recorded-status ${hasRecorded ? "available" : "missing"}`}
              >
                {hasRecorded ? (
                  <>
                    <span>▶</span>
                    <div>
                      <b>توجد حصص مسجلة لهذه المادة</b>
                      <small>
                        يمكن للطالب مشاهدة عينة ثم الاشتراك في المسار.
                      </small>
                    </div>
                    <a href="/programs">عرض الحصص</a>
                  </>
                ) : (
                  <>
                    <span>✦</span>
                    <div>
                      <b>لا توجد حصص مسجلة حاليا</b>
                      <small>
                        يمكن طلب إنتاج شرح AI، ثم يراجعه معلم مختص قبل النشر.
                      </small>
                    </div>
                    <button
                      type="button"
                      disabled={aiLoading}
                      onClick={() => runAI("recorded_lesson")}
                    >
                      {aiLoading
                        ? "جاري بناء الخطة..."
                        : aiRequest
                          ? "✓ تم إنشاء خطة الحصة"
                          : "ولّد حصة مسجلة محمية"}
                    </button>
                  </>
                )}
              </div>
            )}
            {portal === "student" && !needsLearningFields && (
              <div className="smart-route">
                <b>سيتم تحويلك للبوابة المناسبة</b>
                <p>
                  {searchFor === "مدرسة"
                    ? "بوابة المدارس والأسعار السنوية"
                    : searchFor === "جامعة أو كلية"
                      ? "مستكشف الجامعات وشروط القبول"
                      : "بوابة شركات التوظيف والوظائف"}
                </p>
              </div>
            )}
            {supportsLocationChoice && (
              <div className="location-result-note">
                <span>{searchScope === "داخل الدولة" ? "⌂" : "◎"}</span>
                <div>
                  <b>
                    ستظهر النتائج {searchScope === "داخل الدولة" ? "داخل" : "خارج"} {country}
                  </b>
                  <small>
                    نطاق البحث الحالي: {effectiveSearchCountry}. يمكنك تغييره قبل المتابعة.
                  </small>
                </div>
              </div>
            )}
            {aiResult && (
              <section className={`ai-route-result ${aiRequest ? "protected" : ""}`}>
                <header>
                  <span>{aiRequest ? "⬡" : "✦"}</span>
                  <div>
                    <small>
                      {aiMode === "fallback"
                        ? "SMART FALLBACK • AI CREDIT REQUIRED"
                        : aiRequest
                          ? "SUCCESS SHIELD"
                          : "SUCCESS OS AI ROUTER"}
                    </small>
                    <b>
                      {aiRequest
                        ? "خطة حصة مسجلة محمية داخل الموقع"
                        : "مسارك المقترح بالذكاء الاصطناعي"}
                    </b>
                  </div>
                </header>
                <p>{aiResult}</p>
                {aiMode === "fallback" && (
                  <div className="ai-credit-note">
                    التوجيه الأساسي يعمل الآن. يلزم إضافة رصيد OpenAI API لتفعيل التوليد الكامل.
                  </div>
                )}
                {aiRequest && (
                  <footer>
                    <span>✓ مشاهدة للأعضاء فقط</span>
                    <span>✓ تنزيل معطل</span>
                    <span>✓ علامة مائية ديناميكية</span>
                    <span>✓ مراجعة معلم قبل النشر</span>
                    <a href="/content-studio">فتح مهمة الإنتاج ←</a>
                  </footer>
                )}
              </section>
            )}
            <button className="portal-submit">
              {portal === "employer"
                ? "نشر الوظيفة تجريبيا"
                : portal === "jobseeker"
                  ? "التقديم على الوظائف"
                  : portal === "university"
                    ? "إضافة المؤسسة وشروطها"
                    : portal === "teacher" || portal === "center"
                      ? "إرسال طلب الشراكة"
                      : "متابعة الرحلة"}
            </button>
            {submitted && (
              <div className="form-success">
                <b>✓ تم حفظ طلبك</b>
                <p>
                  يتم الآن فتح الوجهة المناسبة لبوابتك. إذا لم يحدث انتقال تلقائي،
                  استخدم الروابط أدناه.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <a className="os-primary" href="/start-journey">ابدأ الرحلة</a>
                  <a href="/student-portal">لوحة الطالب</a>
                  <a href="/teachers">المعلمون</a>
                  <a href="/jobseeker-portal">الباحث عن عمل</a>
                </div>
              </div>
            )}
          </form>
        </div>
        <section className="gateway-links">
          <a href="/global-sources">
            <span>✓</span>
            <b>مصادر الجامعات الرسمية</b>
            <small>الاعتراف ← البرنامج ← الشروط</small>
          </a>
          <a href="/world">
            <span>◎</span>
            <b>دول وأنظمة العالم</b>
            <small>الدولة ← النظام ← المرحلة</small>
          </a>
          <a href="/subject-catalog">
            <span>▦</span>
            <b>المواد المدرسية</b>
            <small>محلي ودولي حسب طلب الطالب</small>
          </a>
          <a href="/university-subjects">
            <span>⚛</span>
            <b>المواد الجامعية</b>
            <small>الدرجة ← التخصص ← المساق</small>
          </a>
          <a href="/content-studio">
            <span>✦</span>
            <b>استوديو المحتوى</b>
            <small>رفع ← تلخيص ← فيديو ← مراجعة</small>
          </a>
          <a href="/security-center">
            <span>⬡</span>
            <b>مركز حماية المحتوى</b>
            <small>بصمة ← صلاحيات ← علامة ← تدقيق</small>
          </a>
          <a href="/degree-finder">
            <span>🎓</span>
            <b>دليل الدرجات والاعتراف</b>
            <small>الدولة ← النمط ← البرنامج</small>
          </a>
          <a href="/admissions">
            <span>◎</span>
            <b>القبول الجامعي</b>
            <small>الشروط ← الملف ← التقديم</small>
          </a>
          <a href="/exam-calendar">
            <span>◫</span>
            <b>رزنامة الاختبارات</b>
            <small>المواعيد والتنبيهات الرسمية</small>
          </a>
          <a href="/rankings">
            <span>◆</span>
            <b>تصنيفات الجامعات</b>
            <small>مقارنة المنهجيات قبل القرار</small>
          </a>
          <a href="/jobs">
            <span>↗</span>
            <b>الوظائف</b>
            <small>المهارات ← المطابقة ← التقديم</small>
          </a>
          <a href="/profile">
            <span>◉</span>
            <b>صفحات المستخدمين</b>
            <small>مساحة منفصلة لكل دور</small>
          </a>
          <a href="/control-center">
            <span>◆</span>
            <b>لوحات التحكم</b>
            <small>الأدوار والصلاحيات الداخلية</small>
          </a>
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="smart-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function portalCopy(id) {
  return {
    student: "مسار طالب مستقل يبدأ بالتعلم والمعلم والمدرسة أو القبول الجامعي.",
    teacher: "شراكة مرنة للشرح المسجل والحصص المباشرة مع تسعير واضح.",
    center: "تشغيل برامج المركز ومعلميه ورفع المحتوى وبيع الحصص.",
    school: "عرض النظام والصفوف والرسوم واستقبال طلبات الالتحاق.",
    university: "نشر البرامج والشروط وربطها بملفات تقديم الطلاب.",
    employer: "نشر الوظائف وتحديد الشروط واستقبال مرشحين بموافقتهم.",
    jobseeker: "بناء ملف مهارات والبحث والتقديم ومتابعة المقابلات.",
  }[id];
}
function stepsFor(id) {
  return id === "student"
    ? [
        "اختر ما تبحث عنه",
        "حدد النظام والصف",
        "اختر الخدمة",
        "انتقل للبوابة المناسبة",
      ]
    : id === "teacher" || id === "center"
      ? [
          "تعريف الشراكة",
          "اختيار المادة والخدمة",
          "تحديد السعر",
          "مراجعة واعتماد",
        ]
      : id === "school"
        ? [
            "بيانات المدرسة",
            "النظام والصفوف",
            "الرسوم السنوية",
            "طلبات الالتحاق",
          ]
        : id === "university"
          ? ["البرامج", "الشروط والمصادر", "طلبات الطلاب", "قرارات القبول"]
          : id === "employer"
            ? [
                "نشر الوظيفة",
                "تحديد الشروط",
                "مطابقة المهارات",
                "المقابلات والعروض",
              ]
            : [
                "الملف المهني",
                "المهارات",
                "مطابقة الوظائف",
                "التقديم والمتابعة",
              ];
}
