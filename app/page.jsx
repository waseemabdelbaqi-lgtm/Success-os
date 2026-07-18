'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {launchLanguages} from './data/education-data';

const copy = {
  en: {
    dir: 'ltr',
    nav: ['Home', 'Gateways', 'About us', 'Our vision', 'Support'],
    navIds: ['top', 'gateways', 'why', 'journey', 'contact'],
    signIn: 'Sign in', start: 'Start learning', eyebrow: 'AI-powered • Human-guided • Built for life',
    slogan: 'Your Path to Success Leaves Ignorance Behind',
    heroA: 'Your learning.', heroB: 'One intelligent system.',
    heroText: 'From your first diagnostic to your next big achievement, SUCCESS OS brings AI tutoring, expert teachers, verified progress, and your lifelong Education Passport into one connected experience.',
    explore: 'Explore your journey', tutor: 'Try AI Tutor', trust: 'Built by Success 4 Sure',
    trustSub: 'International education expertise, now powered by a learner-first intelligent system.',
    stats: [['13+', 'Starting age'], ['2', 'Launch languages'], ['5', 'International curricula'], ['24/7', 'AI learning support']],
    whyEyebrow: 'Not another course platform', whyTitle: 'Everything your education needs, connected.',
    whyText: 'SUCCESS OS understands your level, goals, curriculum, and learning patterns—then coordinates the right content, support, and next step.',
    cards: [
      ['AI Tutor', 'Hints, explanations, and practice grounded in your approved curriculum—not generic answers.', 'spark'],
      ['Education Passport', 'A permanent, permission-based record of your skills, evidence, goals, and verified achievements.', 'passport'],
      ['Human Experts', 'Book verified teachers by curriculum, language, price, availability, and learning style.', 'people'],
      ['Mastery Engine', 'See what you truly understand, where misconceptions remain, and exactly what to do next.', 'chart']
    ],
    journeyEyebrow: 'One connected learner journey', journeyTitle: 'Know where you are. See where to go.',
    journeyText: 'No maze of menus. Your dashboard gives you one meaningful next step based on evidence—not guesswork.',
    steps: [
      ['01', 'Discover your level', 'Complete a short adaptive diagnostic that measures skills, prerequisites, confidence, and misconceptions.'],
      ['02', 'Get your learning plan', 'Receive a clear pathway with goals, milestones, estimated effort, and the reason behind every recommendation.'],
      ['03', 'Learn with AI + humans', 'Study interactive lessons, practice intelligently, ask the AI Tutor, or book a verified expert when you need one.'],
      ['04', 'Prove your mastery', 'Turn assessments, projects, and teacher feedback into verified evidence in your Education Passport.']
    ],
    dashboard: 'Learner dashboard', today: "Today's priority", continue: 'Continue: Electric Circuits', mins: '18 min remaining',
    mastery: 'Physics mastery', streak: 'Learning consistency', days: '6 day streak', next: 'Next milestone', nextVal: 'Current & resistance mastery check',
    programEyebrow: 'Built around your curriculum', programTitle: 'Start with what we know best.',
    programText: 'The first SUCCESS OS pathways focus on international Physics and Chemistry, backed by years of Success 4 Sure teaching expertise.',
    subjects: ['Physics', 'Chemistry'],
    curricula: ['EST', 'ACT Subject Tests', 'AP', 'IGCSE', 'A Level'],
    lesson: 'Sample learning pathway', unit: 'Electricity & Circuits', unitSub: 'Edexcel AS Physics • 7 skills',
    lessonRows: [['Diagnostic checkpoint', 'Completed'], ['Charge & current', 'In progress'], ['Resistance & I–V graphs', 'Up next'], ['Mastery check', 'Locked']],
    teacherEyebrow: 'The best of AI and human teaching', teacherTitle: 'Real teachers remain essential.',
    teacherText: 'AI helps you understand and practice. Expert teachers bring judgment, motivation, experience, and the human connection that great learning needs.',
    teacherPoints: ['Verified identity and qualifications', 'Curriculum-specific expertise', 'Transparent pricing and availability', 'Session outcomes saved to your Passport'],
    findTeacher: 'Find your teacher',
    aiEyebrow: 'AI Tutor preview', aiTitle: 'Ask. Think. Understand.',
    aiText: 'The Tutor guides you step by step and adapts to your level. It does not rush to reveal the answer.',
    aiPrompt: 'A 12 V battery is connected to a 4 Ω resistor. Where should I start?',
    aiAnswer: 'Great—start with the relationship between voltage, current, and resistance. Which formula connects V, I, and R?',
    aiPlaceholder: 'Ask about Physics or Chemistry…', aiSend: 'Ask', aiSource: 'Grounded in: Electric Circuits • Ohm’s Law',
    safety: 'AI responses in the MVP are grounded in approved learning content and can be reported or escalated to a teacher.',
    passportEyebrow: 'Your learning belongs with you', passportTitle: 'One Education Passport. For life.',
    passportText: 'Your progress should not disappear when you change a school, course, country, or career. Preserve the evidence and decide who can see it.',
    passportItems: ['Skills & mastery', 'Assessments', 'Projects & evidence', 'Verified credentials'],
    ctaEyebrow: 'The next chapter of education starts here', ctaTitle: 'Build your future with a system that grows with you.',
    ctaText: 'Join the first generation of learners shaping SUCCESS OS.', ctaButton: 'Start your journey', ctaSecondary: 'Talk to Success 4 Sure',
    footerText: 'The AI-powered lifelong Education Operating System.', footerCols: [['Platform', 'Learning', 'AI Tutor', 'Teachers', 'Education Passport'], ['Programs', 'EST & ACT', 'AP', 'IGCSE', 'A Level'], ['Company', 'About', 'Safety & Privacy', 'Contact', 'Success 4 Sure Academy']],
    rights: '© 2026 SUCCESS OS by Success 4 Sure. All rights reserved.',
    modalTitle: 'Begin your SUCCESS OS journey', modalText: 'Choose who you are. We will shape the next step around you.',
    roles: [['Student', 'Start a personalized learning journey'], ['Parent', 'Support progress with age-appropriate insight'], ['Teacher', 'Teach, mentor, and grow your impact'], ['Institution', 'Connect your learners and programs']],
    modalNext: 'Continue', close: 'Close', demoReply: 'Let’s solve it together. First, tell me what you already know and which curriculum you are studying.'
  },
  ar: {
    dir: 'rtl',
    nav: ['الرئيسية', 'البوابات', 'من نحن', 'رؤيتنا', 'الدعم'],
    navIds: ['top', 'gateways', 'why', 'journey', 'contact'],
    signIn: 'تسجيل الدخول', start: 'ابدأ التعلم', eyebrow: 'بالذكاء الاصطناعي • بإشراف الإنسان • معك مدى الحياة',
    slogan: 'طريقك نحو النجاح يمحو طريقك نحو الجهل',
    heroA: 'تعليمك.', heroB: 'في نظام ذكي واحد.',
    heroText: 'من أول اختبار تشخيصي إلى إنجازك القادم، يجمع SUCCESS OS المعلم الذكي والخبراء والتقدم الموثق وجوازك التعليمي الدائم في تجربة واحدة مترابطة.',
    explore: 'اكتشف رحلتك', tutor: 'جرّب المعلم الذكي', trust: 'من Success 4 Sure',
    trustSub: 'خبرة حقيقية في التعليم الدولي، اليوم ضمن نظام ذكي يضع الطالب أولاً.',
    stats: [['+13', 'العمر عند الانطلاق'], ['2', 'لغات الإطلاق'], ['5', 'مناهج دولية'], ['24/7', 'دعم تعليمي ذكي']],
    whyEyebrow: 'مش منصة دورات جديدة', whyTitle: 'كل ما يحتاجه تعليمك، في مكان واحد.',
    whyText: 'يفهم SUCCESS OS مستواك وهدفك ومنهاجك وطريقة تعلمك، ثم ينسق المحتوى والدعم والخطوة التالية المناسبة لك.',
    cards: [
      ['المعلم الذكي', 'تلميحات وشرح وتدريب مبني على منهاجك المعتمد، وليس إجابات عامة.', 'spark'],
      ['الجواز التعليمي', 'سجل دائم قائم على الصلاحيات لمهاراتك وأهدافك وإنجازاتك الموثقة.', 'passport'],
      ['خبراء حقيقيون', 'احجز معلمين موثقين حسب المنهاج واللغة والسعر والوقت وطريقة التعليم.', 'people'],
      ['محرك الإتقان', 'اعرف ماذا أتقنت، وأين بقيت الأخطاء، وما هي خطوتك التالية بالضبط.', 'chart']
    ],
    journeyEyebrow: 'رحلة طالب واحدة مترابطة', journeyTitle: 'اعرف مستواك. وشوف طريقك.',
    journeyText: 'بدون قوائم معقدة. تعرض لوحتك خطوة واحدة مفيدة مبنية على أدلة حقيقية، مش تخمين.',
    steps: [
      ['01', 'اكتشف مستواك', 'اختبار تشخيصي قصير يقيس المهارات والمتطلبات السابقة والثقة والأخطاء الشائعة.'],
      ['02', 'خذ خطتك التعليمية', 'مسار واضح فيه أهداف ومراحل ووقت متوقع وسبب كل توصية.'],
      ['03', 'تعلم مع الذكاء والإنسان', 'دروس تفاعلية وتدريب ذكي ومعلم AI، أو احجز خبيرًا حقيقيًا عندما تحتاجه.'],
      ['04', 'أثبت إتقانك', 'حوّل الاختبارات والمشاريع وملاحظات المعلمين إلى أدلة موثقة في جوازك التعليمي.']
    ],
    dashboard: 'لوحة الطالب', today: 'أولوية اليوم', continue: 'تابع: الدوائر الكهربائية', mins: 'بقي 18 دقيقة',
    mastery: 'إتقان الفيزياء', streak: 'الاستمرارية', days: '6 أيام متتالية', next: 'المرحلة القادمة', nextVal: 'اختبار إتقان التيار والمقاومة',
    programEyebrow: 'مبني حول منهاجك', programTitle: 'نبدأ من أقوى خبراتنا.',
    programText: 'تركز المسارات الأولى على الفيزياء والكيمياء للمناهج الدولية، مدعومة بسنوات من خبرة Success 4 Sure.',
    subjects: ['الفيزياء', 'الكيمياء'],
    curricula: ['EST', 'ACT Subject Tests', 'AP', 'IGCSE', 'A Level'],
    lesson: 'نموذج مسار تعليمي', unit: 'الكهرباء والدوائر', unitSub: 'Edexcel AS Physics • 7 مهارات',
    lessonRows: [['الاختبار التشخيصي', 'مكتمل'], ['الشحنة والتيار', 'قيد التعلم'], ['المقاومة ومنحنيات I–V', 'التالي'], ['اختبار الإتقان', 'مغلق']],
    teacherEyebrow: 'أفضل ما في الذكاء والتعليم الإنساني', teacherTitle: 'المعلم الحقيقي أساسي.',
    teacherText: 'الذكاء الاصطناعي يساعدك على الفهم والتدريب، والمعلم الخبير يقدم الحكم والخبرة والتحفيز والعلاقة الإنسانية التي يحتاجها التعليم العظيم.',
    teacherPoints: ['هوية ومؤهلات موثقة', 'خبرة متخصصة في المنهاج', 'سعر ووقت متاحان بوضوح', 'نتائج الحصة تحفظ في جوازك'],
    findTeacher: 'ابحث عن معلمك',
    aiEyebrow: 'تجربة المعلم الذكي', aiTitle: 'اسأل. فكّر. افهم.',
    aiText: 'يرشدك المعلم الذكي خطوة بخطوة ويتكيف مع مستواك، ولا يتسرع في إعطائك الحل.',
    aiPrompt: 'بطارية 12 V موصولة بمقاومة 4 Ω. من وين أبدأ؟',
    aiAnswer: 'ممتاز، ابدأ بالعلاقة بين فرق الجهد والتيار والمقاومة. ما هي المعادلة التي تربط V وI وR؟',
    aiPlaceholder: 'اسأل عن الفيزياء أو الكيمياء…', aiSend: 'اسأل', aiSource: 'المصدر: الدوائر الكهربائية • قانون أوم',
    safety: 'إجابات الذكاء الاصطناعي في النسخة الأولى مبنية على محتوى تعليمي معتمد ويمكن الإبلاغ عنها أو تحويلها لمعلم.',
    passportEyebrow: 'تعليمك ملكك', passportTitle: 'جواز تعليمي واحد. مدى الحياة.',
    passportText: 'تقدمك ما لازم يضيع عندما تغير مدرسة أو دورة أو بلد أو مهنة. احفظ أدلتك وحدد بنفسك من يمكنه رؤيتها.',
    passportItems: ['المهارات والإتقان', 'الاختبارات', 'المشاريع والأدلة', 'الشهادات الموثقة'],
    ctaEyebrow: 'الفصل القادم من التعليم يبدأ هنا', ctaTitle: 'ابنِ مستقبلك مع نظام يكبر معك.',
    ctaText: 'كن من الجيل الأول الذي يشارك في بناء SUCCESS OS.', ctaButton: 'ابدأ رحلتك', ctaSecondary: 'تواصل مع Success 4 Sure',
    footerText: 'نظام التعليم المدعوم بالذكاء الاصطناعي مدى الحياة.', footerCols: [['المنصة', 'التعلم', 'المعلم الذكي', 'المعلمون', 'الجواز التعليمي'], ['البرامج', 'EST وACT', 'AP', 'IGCSE', 'A Level'], ['الشركة', 'من نحن', 'الأمان والخصوصية', 'تواصل معنا', 'Success 4 Sure Academy']],
    rights: '© 2026 SUCCESS OS by Success 4 Sure. جميع الحقوق محفوظة.',
    modalTitle: 'ابدأ رحلتك مع SUCCESS OS', modalText: 'اختر دورك وسنبني الخطوة التالية حول احتياجك.',
    roles: [['طالب', 'ابدأ رحلة تعلم شخصية'], ['ولي أمر', 'تابع التقدم بصلاحيات مناسبة للعمر'], ['معلم', 'علّم ووجّه ووسع أثرك'], ['مؤسسة', 'اربط طلابك وبرامجك']],
    modalNext: 'متابعة', close: 'إغلاق', demoReply: 'خلينا نحلها مع بعض. أولًا احكيلي شو بتعرف عن الموضوع وأي منهاج بتدرس.'
  }
};

function Icon({name}) {
  const paths = {
    spark: <><path d="M12 2l1.7 5.1L19 9l-5.3 1.9L12 16l-1.7-5.1L5 9l5.3-1.9L12 2Z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
    passport: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 17h6M12 10v4M10 12h4"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M16 4a3 3 0 0 1 0 6M17 14c2.7.3 4 2.2 4 5"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function Logo({dark=false}) {
  return <a className={`logo brand-image ${dark ? 'dark' : ''}`} href="#top" aria-label="SUCCESS 4 SURE home">
    <span className="success-wordmark"><i>⌁</i><b>SUCCESS</b><small>4SURE</small></span>
  </a>;
}

export default function HomePage() {
  const initialLang = 'ar';
  const [lang, setLang] = useState(initialLang);
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(false);
  const [role, setRole] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [languageSheet,setLanguageSheet]=useState(false);
  const [selectedLanguage,setSelectedLanguage]=useState(initialLang);
  const [selectedDirection,setSelectedDirection]=useState(initialLang==='ar'?'rtl':'ltr');
  const t = copy[lang];
  const flipLang = () => {const next=lang==='en'?'ar':'en';setLang(next);setSelectedLanguage(next);setSelectedDirection(next==='ar'?'rtl':'ltr')};

  useEffect(() => {
    document.documentElement.lang = selectedLanguage;
    document.documentElement.dir = selectedDirection;
  }, [lang, selectedLanguage, selectedDirection]);

  const submitQuestion = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setMessages([{q: question.trim(), a: t.demoReply}]);
    setQuestion('');
  };

  const navItems = useMemo(() => t.nav.map((label, i) => ({label, id:t.navIds[i]})), [t]);
  const gateways = lang === 'en' ? [
    ['01','◉','Students','Student journey','Learning • teachers • admissions','Build your learning plan, book support and track school or university admission.','student'],
    ['02','♙','Teachers','Education experts','Teaching • content • income','Teach live, upload lessons and join the academic team.','teacher'],
    ['03','▦','Learning centers','Education providers','Courses • certificates • classes','Offer courses, teachers, recorded content and verified certificates.','center'],
    ['04','⌂','Schools','K–12 institutions','Admissions • fees • curricula','Present grades, education systems, annual fees and applications.','school'],
    ['05','🎓','Universities & colleges','Higher education','Programs • requirements • apply','Connect students to recognized programs and admission requirements.','university'],
    ['06','↗','Employers','Opportunity providers','Jobs • candidates • matching','Publish roles and receive matched, qualified applications.','employer'],
    ['07','◇','Job seekers','Career journey','CV • skills • applications','Build your profile, discover roles and track every application.','jobseeker'],
    ['08','✦','Join us','Partnership gateway','Teacher • center • school • university • employer','Choose your organization type and start a verified partnership with SUCCESS OS.','join']
  ] : [
    ['01','◉','الطلاب','رحلة الطالب','تعلم • معلمون • قبول','خطة تعلم وحصص ومعلمون ومدارس وقبول جامعي في مساحة طالب مستقلة.','student'],
    ['02','♙','المعلمون','خبراء التعليم','تدريس • محتوى • دخل','قدّم حصصًا مباشرة، وارفع الشروحات، وانضم إلى الفريق الأكاديمي.','teacher'],
    ['03','▦','المراكز التعليمية','مقدمو التعليم','دورات • شهادات • حصص','اعرض الدورات والمعلمين والمحتوى المسجل والشهادات الموثقة.','center'],
    ['04','⌂','المدارس','التعليم المدرسي','قبول • رسوم • مناهج','اعرض الصفوف والأنظمة التعليمية والرسوم السنوية واستقبل الطلبات.','school'],
    ['05','🎓','الجامعات والكليات','التعليم العالي','برامج • شروط • تقديم','اربط الطالب بالبرامج المعترف بها وشروط القبول والتقديم.','university'],
    ['06','↗','شركات التوظيف','صنّاع الفرص','وظائف • مرشحون • مطابقة','انشر الوظائف واستقبل طلبات مرشحين مطابقين للشروط.','employer'],
    ['07','◇','الباحثون عن العمل','المسار المهني','سيرة • مهارات • تقديم','ابنِ ملفك، واكتشف الفرص، وتابع كل طلب من لوحة واحدة.','jobseeker'],
    ['08','✦','انضم إلينا','بوابة الشراكات','معلم • مركز • مدرسة • جامعة • كلية • شركة','اختر نوع الشراكة وابدأ طلب انضمام موثّق إلى منظومة SUCCESS OS.','join']
  ];
  const partnerGateways=['teacher','center','school','university','employer'];
  const searchRoutes={teacher:'/teachers',center:'/partner-search?portal=center',school:'/school-finder',university:'/admissions',employer:'/jobs'};

  return <div id="top" className="app phase11-landing">
    <header className="nav-shell">
      <nav className="nav container">
        <Logo />
        <button className="menu-button" onClick={() => setMenu(!menu)} aria-label="Toggle menu"><span></span><span></span><span></span></button>
        <div className={`nav-links ${menu ? 'open' : ''}`}>
          {navItems.map(item => <a key={item.id} href={item.id.startsWith('/') ? item.id : `#${item.id}`} onClick={() => setMenu(false)}>{item.label}</a>)}
          <button className="lang" onClick={flipLang}>{lang === 'en' ? 'العربية' : 'English'}</button>
        </div>
        <div className="nav-actions">
          <button className="lang" onClick={flipLang}>{lang === 'en' ? 'العربية' : 'English'}</button>
          <button className="world-lang-button" onClick={()=>setLanguageSheet(true)}>◎ {lang==='en'?'All languages':'كل اللغات'}</button>
          <a className="signin" href="/login">{t.signIn}</a>
          <a className="button small" href="/start-journey">{lang==='en'?'Start journey':'ابدأ الرحلة'}</a>
        </div>
      </nav>
    </header>

    <main>
      <section className="portal-first-stage">
        <div className="portal-first-backdrop"><img src="/media/success-future-gateways.webp" alt="بوابات SUCCESS OS المستقبلية"/></div>
        <div className="container portal-first-content"><header><small>YOUR JOURNEY STARTS HERE</small><h1>{lang==='en'?'Choose your gateway. Reach your goal.':'اختر بوابتك. واصل إلى هدفك.'}</h1><p>{lang==='en'?'A clear beginning for every learner, educator, institution and opportunity.':'بداية واضحة لكل طالب ومعلم ومؤسسة وفرصة، ثم فلاتر تقودك مباشرة إلى طلبك.'}</p></header><div className="portal-first-grid">{gateways.map(([number,icon,label,,,description,id],i)=><a href={`/start-journey?portal=${id}`} style={{'--portal-pos':`${(i%4)*30}% ${i<4?'20%':'78%'}`}} key={id}><span className="portal-image"></span><small>{number}</small><b>{icon} {label}</b><p>{description}</p></a>)}</div><a className="portal-start-button" href="/start-journey"><span>{lang==='en'?'Start the journey':'ابدأ الرحلة'}</span><b>←</b></a></div>
      </section>
      <section className="hero">
        <div className="hero-grid container">
          <div className="hero-copy reveal">
            <div className="eyebrow"><span></span>{t.eyebrow}</div>
            <h1>{t.heroA}<br/><span>{t.heroB}</span></h1>
            <div className="official-slogan">SUCCESS OS — {t.slogan}</div>
            <p>{t.heroText}</p>
            <div className="hero-actions">
              <a className="button" href="#gateways">{t.explore}<b>→</b></a>
              <a className="button ghost" href="#ai"><Icon name="spark"/>{t.tutor}</a>
            </div>
            <div className="founder-note"><span className="avatar">S4S</span><div><strong>{t.trust}</strong><small>{t.trustSub}</small></div></div>
          </div>
          <div className="hero-visual reveal delay">
            <div className="orbital one"></div><div className="orbital two"></div>
            <div className="success-3d-world"><i className="ring-a"></i><i className="ring-b"></i><strong>S</strong><span>LEARN • BUILD • SUCCEED</span></div>
            <div className="dashboard-card">
              <div className="dash-top"><div><small>{t.today}</small><strong>{t.continue}</strong></div><span>↗</span></div>
              <div className="progress"><i style={{width:'68%'}}></i></div><small>{t.mins}</small>
              <div className="dash-grid">
                <div className="mastery-ring"><div><b>72%</b><small>{t.mastery}</small></div></div>
                <div className="dash-metrics"><div><small>{t.streak}</small><strong>🔥 {t.days}</strong></div><div><small>{t.next}</small><strong>{t.nextVal}</strong></div></div>
              </div>
            </div>
            <div className="float-card tutor-float"><span><Icon name="spark"/></span><div><small>AI TUTOR</small><b>{lang === 'en' ? 'Ready when you are' : 'جاهز وقت ما تحتاج'}</b></div></div>
            <div className="float-card pass-float"><span><Icon name="passport"/></span><div><small>EDUCATION PASSPORT</small><b>{lang === 'en' ? 'New skill verified' : 'تم توثيق مهارة جديدة'}</b></div></div>
          </div>
        </div>
        <div className="stats container">{t.stats.map(([n,l]) => <div key={l}><strong>{n}</strong><span>{l}</span></div>)}</div>
      </section>

      <section className="home-gateway organized" id="gateways">
        <div className="container">
          <header><div><small>{lang==='en'?'EIGHT CONNECTED GATEWAYS':'ثماني بوابات مترابطة'}</small><h2>{lang==='en'?'Choose where your SUCCESS journey begins':'اختر البوابة التي تبدأ منها رحلتك'}</h2><p>{lang==='en'?'Search for a trusted partner or join the network through a dedicated path.':'ابحث عن شريك موثوق أو انضم إلى الشبكة من خلال مسار واضح ومستقل.'}</p></div><a href="/join-us">{lang==='en'?'Partnership gateway':'بوابة انضم إلينا'} ←</a></header>
          <div className="gateway-join-steps"><span><b>1</b>{lang==='en'?'Choose your gateway':'اختر بوابتك'}</span><i></i><span><b>2</b>{lang==='en'?'Add your basic details':'أدخل بياناتك الأساسية'}</span><i></i><span><b>3</b>{lang==='en'?'Open your private journey':'انتقل لمساحتك الخاصة'}</span></div>
          <div className="gateway-join-grid">{gateways.map(([number,icon,label,category,tags,description,id])=><article className={`gateway-join-card gateway-${id}`} key={id}><div className="gateway-card-head"><span>{icon}</span><small>{lang==='en'?`GATEWAY ${number}`:`البوابة ${number}`}</small></div><div className="gateway-card-copy"><em>{category}</em><h3>{label}</h3><p>{description}</p><strong>{tags}</strong></div>{partnerGateways.includes(id)?<div className="gateway-card-actions"><a href={searchRoutes[id]}><span>{lang==='en'?`Find ${label}`:`ابحث في ${label}`}</span><b>⌕</b></a><a href={`/join-us?role=${id}`}><span>{lang==='en'?`Join as ${label}`:`انضم إلى ${label}`}</span><b>＋</b></a></div>:<a href={id==='student'?'/student-portal':id==='jobseeker'?'/jobseeker-portal':'/join-us'}><span>{id==='join'?(lang==='en'?'Open partnership gateway':'افتح بوابة الشراكات'):(lang==='en'?'Open this gateway':'افتح هذه البوابة')}</span><b>←</b></a>}</article>)}</div>
          <section className="work-with-us-network">
            <div className="network-copy"><small>{lang==='en'?'CONNECTED PARTNERSHIP NETWORK':'شبكة الشراكة المتصلة'}</small><h2>{lang==='en'?'Work with SUCCESS OS':'اعمل معنا'}</h2><p>{lang==='en'?'Join the education-to-employment ecosystem through the role that fits you.':'انضم إلى منظومة تصل التعليم بالجامعة والعمل من خلال الدور المناسب لك.'}</p></div>
            <div className="network-map">
              <div className="network-side"><a href="/join-us?role=teacher">{lang==='en'?'Teacher':'معلم'}<i>←</i></a><a href="/join-us?role=center">{lang==='en'?'Learning center':'مركز تعليمي'}<i>←</i></a><a href="/join-us?role=school">{lang==='en'?'School':'مدرسة'}<i>←</i></a></div>
              <a className="network-core" href="/join-us"><span>✦</span><b>{lang==='en'?'JOIN US':'انضم إلينا'}</b><small>SUCCESS OS</small></a>
              <div className="network-side"><a href="/join-us?role=university"><i>→</i>{lang==='en'?'University':'جامعة'}</a><a href="/join-us?role=college"><i>→</i>{lang==='en'?'College':'كلية'}</a><a href="/join-us?role=employer"><i>→</i>{lang==='en'?'Employer':'شركة توظيف'}</a></div>
            </div>
            <div className="gateway-help"><div><span>◎</span><div><small>{lang==='en'?'NOT SURE WHERE TO START?':'لست متأكدًا من البوابة المناسبة؟'}</small><h3>{lang==='en'?'Tell us your country and goal—SUCCESS OS will route you.':'اختر الدولة والهدف، وسيقودك SUCCESS OS إلى المسار الصحيح.'}</h3></div></div><a href="/access">{lang==='en'?'Help me choose':'ساعدني في الاختيار'} ←</a></div>
          </section>
        </div>
      </section>

      <section className="knowledge-entry"><div className="container"><header><small>ONE LEARNING UNIVERSE</small><h2>{lang==='en'?'School, university and career learning—inside one platform':'التعلم المدرسي والجامعي والمهني داخل منصة واحدة'}</h2></header><div className="knowledge-entry-grid"><a href="/subject-catalog"><span>▦</span><small>LOCAL + INTERNATIONAL</small><h3>{lang==='en'?'School subjects':'المواد المدرسية'}</h3><p>{lang==='en'?'Curricula by country, system and grade.':'مناهج حسب الدولة والنظام والصف.'}</p><b>↗</b></a><a href="/university-subjects"><span>⚛</span><small>COLLEGE + UNIVERSITY</small><h3>{lang==='en'?'University subjects':'المواد الجامعية'}</h3><p>{lang==='en'?'Degrees, disciplines and course pathways.':'درجات وتخصصات ومسارات مساقات.'}</p><b>↗</b></a><a href="/content-studio"><span>✦</span><small>HUMAN-GUIDED AI</small><h3>{lang==='en'?'Content studio':'استوديو بناء المحتوى'}</h3><p>{lang==='en'?'Upload, summarize, script and review.':'ارفع ولخّص وابنِ الفيديو ثم راجع.'}</p><b>↗</b></a><a href="/source-registry"><span>✓</span><small>RIGHTS + PROVENANCE</small><h3>{lang==='en'?'Source registry':'سجل المصادر والحقوق'}</h3><p>{lang==='en'?'Know what can be used and how.':'اعرف ما يمكن استخدامه وكيف.'}</p><b>↗</b></a></div><div className="home-shield"><span>⬡</span><div><small>SUCCESS SHIELD</small><b>كل درس وفيديو وامتحان يحمل بصمة وحقوقًا وصلاحية واضحة</b></div><a href="/security-center">افتح مركز الحماية ←</a></div></div></section>

      <section className="home-core-summary" id="why">
        <div className="container">
          <header><small>FUTURE-READY EDUCATION PATH</small><h2>{lang==='en'?'From learning foundations to global opportunity.':'من تأسيس التعلم إلى الفرصة العالمية.'}</h2><p>{lang==='en'?'One connected journey for school, university, practical experience and employment.':'رحلة واحدة مترابطة تجمع المدرسة والجامعة والخبرة العملية والتوظيف.'}</p></header>
          <div className="home-core-grid">
            <article><span>01</span><i>✦</i><b>{lang==='en'?'Foundation & discovery':'التأسيس والاستكشاف'}</b><p>{lang==='en'?'School subjects, strengths and a personal learning path.':'المواد المدرسية، اكتشاف القدرات ومسار تعلم شخصي.'}</p><a href="/subject-catalog">{lang==='en'?'Explore learning':'استكشف التعلم'} ←</a></article>
            <article><span>02</span><i>🎓</i><b>{lang==='en'?'Specialization & study':'التخصص والدراسة'}</b><p>{lang==='en'?'University programs, admission and recognized degrees.':'برامج جامعية، قبول ودرجات معترف بها.'}</p><a href="/admissions">{lang==='en'?'Find a program':'ابحث عن برنامج'} ←</a></article>
            <article><span>03</span><i>⌁</i><b>{lang==='en'?'Experience & skills':'الخبرة والمهارات'}</b><p>{lang==='en'?'Projects, courses, certificates and verified evidence.':'مشاريع، دورات، شهادات وأدلة مهارية موثقة.'}</p><a href="/programs">{lang==='en'?'Build skills':'ابنِ مهاراتك'} ←</a></article>
            <article><span>04</span><i>↗</i><b>{lang==='en'?'Employment & growth':'التوظيف والنمو'}</b><p>{lang==='en'?'Matched roles, applications and continuous development.':'وظائف مطابقة، تقديم وتطوير مستمر.'}</p><a href="/jobs">{lang==='en'?'View opportunities':'شاهد الفرص'} ←</a></article>
          </div>
          <footer><a className="button dark" href="/start-journey">{lang==='en'?'Start now':'ابدأ الآن'} ←</a><a href="/trust">{lang==='en'?'Safety and verification':'الأمان والتحقق'}</a></footer>
        </div>
      </section>

      <section className="cta-section" id="contact"><div className="container cta-card"><div className="cta-orb a"></div><div className="cta-orb b"></div><div className="eyebrow light">{t.ctaEyebrow}</div><h2>{t.ctaTitle}</h2><p>{t.ctaText}</p><div><button className="button mint-button" onClick={()=>setModal(true)}>{t.ctaButton}<b>→</b></button><a className="button clear" href="https://www.success4sureacademy.com/" target="_blank" rel="noreferrer">{t.ctaSecondary}</a></div></div></section>
    </main>

    <footer><div className="container footer-grid"><div className="footer-brand"><Logo/><p>{t.footerText}</p><div className="socials"><a href="https://www.instagram.com/success4surejo/" target="_blank" rel="noreferrer">IG</a><a href="mailto:info@success4sureacademy.com">@</a><a href="https://www.success4sureacademy.com/" target="_blank" rel="noreferrer">↗</a></div></div>{t.footerCols.map(col=><div className="footer-col" key={col[0]}><strong>{col[0]}</strong>{col.slice(1).map(x=><a href="#top" key={x}>{x}</a>)}</div>)}</div><div className="container footer-bottom"><span>{t.rights}</span><span>Amman • Dubai • Online Worldwide</span></div></footer>

    {modal && <div className="modal-backdrop" onMouseDown={(e)=>e.target===e.currentTarget&&setModal(false)}><div className="modal"><button className="modal-close" onClick={()=>setModal(false)}>×</button><Logo dark/><h2>{t.modalTitle}</h2><p>{t.modalText}</p><div className="role-grid">{t.roles.map(([name,desc],i)=><button key={name} className={role===name?'selected':''} onClick={()=>setRole(name)}><span>{['◉','◇','✦','▦'][i]}</span><div><strong>{name}</strong><small>{desc}</small></div><b>→</b></button>)}</div><button className="button modal-next" disabled={!role} onClick={()=>{window.location.href='/onboarding'}}>{t.modalNext}<b>→</b></button></div></div>}
    {languageSheet&&<div className="language-sheet" onMouseDown={e=>e.target===e.currentTarget&&setLanguageSheet(false)}><div><button onClick={()=>setLanguageSheet(false)}>×</button><small>GLOBAL LANGUAGE LAYER</small><h2>اختر من جميع اللغات</h2><p>العربية وEnglish واجهتان أصليتان. بقية اللغات تستخدم طبقة ترجمة تلقائية وتبقى خاضعة للمراجعة البشرية.</p><section>{launchLanguages.map(([code,name,dir,status])=><button className={code===selectedLanguage?'active':''} onClick={()=>{setSelectedLanguage(code);setSelectedDirection(dir==='RTL'?'rtl':'ltr');setLang(code==='ar'?'ar':'en');setLanguageSheet(false)}} key={code}><b>{name}</b><span>{code.toUpperCase()} • {dir} • {status}</span></button>)}</section></div></div>}
  </div>;
}
