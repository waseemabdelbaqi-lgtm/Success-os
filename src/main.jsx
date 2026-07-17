import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const copy = {
  en: {
    dir: 'ltr',
    nav: ['Why SUCCESS OS', 'Learning Journey', 'Programs', 'Teachers'],
    navIds: ['why', 'journey', 'programs', 'teachers'],
    signIn: 'Sign in', start: 'Start learning', eyebrow: 'AI-powered • Human-guided • Built for life',
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
    nav: ['لماذا SUCCESS OS', 'رحلة التعلم', 'البرامج', 'المعلمون'],
    navIds: ['why', 'journey', 'programs', 'teachers'],
    signIn: 'تسجيل الدخول', start: 'ابدأ التعلم', eyebrow: 'بالذكاء الاصطناعي • بإشراف الإنسان • معك مدى الحياة',
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
  return <a className={`logo ${dark ? 'dark' : ''}`} href="#top" aria-label="SUCCESS OS home">
    <span className="logo-mark"><i></i><b>S</b></span>
    <span><strong>SUCCESS</strong><em>OS</em><small>by Success 4 Sure</small></span>
  </a>;
}

export function App({ initialLang = 'en' }) {
  const [lang, setLang] = useState(initialLang);
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(false);
  const [role, setRole] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const t = copy[lang];
  const flipLang = () => setLang(l => l === 'en' ? 'ar' : 'en');

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
  }, [lang, t.dir]);

  const submitQuestion = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setMessages([{q: question.trim(), a: t.demoReply}]);
    setQuestion('');
  };

  const navItems = useMemo(() => t.nav.map((label, i) => ({label, id:t.navIds[i]})), [t]);

  return <div id="top" className="app">
    <header className="nav-shell">
      <nav className="nav container">
        <Logo />
        <button className="menu-button" onClick={() => setMenu(!menu)} aria-label="Toggle menu"><span></span><span></span><span></span></button>
        <div className={`nav-links ${menu ? 'open' : ''}`}>
          {navItems.map(item => <a key={item.id} href={`#${item.id}`} onClick={() => setMenu(false)}>{item.label}</a>)}
          <button className="lang" onClick={flipLang}>{lang === 'en' ? 'العربية' : 'English'}</button>
        </div>
        <div className="nav-actions">
          <button className="lang" onClick={flipLang}>{lang === 'en' ? 'العربية' : 'English'}</button>
          <a className="signin" href="#contact">{t.signIn}</a>
          <button className="button small" onClick={() => setModal(true)}>{t.start}</button>
        </div>
      </nav>
    </header>

    <main>
      <section className="hero">
        <div className="hero-grid container">
          <div className="hero-copy reveal">
            <div className="eyebrow"><span></span>{t.eyebrow}</div>
            <h1>{t.heroA}<br/><span>{t.heroB}</span></h1>
            <p>{t.heroText}</p>
            <div className="hero-actions">
              <button className="button" onClick={() => setModal(true)}>{t.explore}<b>→</b></button>
              <a className="button ghost" href="#ai"><Icon name="spark"/>{t.tutor}</a>
            </div>
            <div className="founder-note"><span className="avatar">S4S</span><div><strong>{t.trust}</strong><small>{t.trustSub}</small></div></div>
          </div>
          <div className="hero-visual reveal delay">
            <div className="orbital one"></div><div className="orbital two"></div>
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

      <section className="section why" id="why">
        <div className="container">
          <div className="section-head centered"><div className="eyebrow mint">{t.whyEyebrow}</div><h2>{t.whyTitle}</h2><p>{t.whyText}</p></div>
          <div className="feature-grid">{t.cards.map(([title,body,icon], i) => <article className={`feature-card card-${i+1}`} key={title}><span className="feature-icon"><Icon name={icon}/></span><div className="feature-number">0{i+1}</div><h3>{title}</h3><p>{body}</p><a href="#journey" aria-label={title}>↗</a></article>)}</div>
        </div>
      </section>

      <section className="section journey" id="journey">
        <div className="container journey-grid">
          <div className="sticky-copy"><div className="eyebrow mint">{t.journeyEyebrow}</div><h2>{t.journeyTitle}</h2><p>{t.journeyText}</p><div className="mini-dashboard"><div className="mini-title"><span className="mini-logo">S</span><div><small>{t.dashboard}</small><strong>{t.today}</strong></div><b>•••</b></div><div className="focus-task"><span>▶</span><div><strong>{t.continue}</strong><small>{t.mins}</small></div></div><div className="skill-bars"><div><span>Mechanics</span><i><b style={{width:'84%'}}></b></i><em>84%</em></div><div><span>Electricity</span><i><b style={{width:'61%'}}></b></i><em>61%</em></div><div><span>Waves</span><i><b style={{width:'46%'}}></b></i><em>46%</em></div></div></div></div>
          <div className="steps">{t.steps.map(([num,title,body], i) => <article className="step" key={title}><span>{num}</span><div><h3>{title}</h3><p>{body}</p></div><i className={i < 3 ? '' : 'last'}></i></article>)}</div>
        </div>
      </section>

      <section className="section programs" id="programs">
        <div className="container program-grid">
          <div className="program-copy"><div className="eyebrow mint">{t.programEyebrow}</div><h2>{t.programTitle}</h2><p>{t.programText}</p><div className="subject-pills">{t.subjects.map((s,i)=><span key={s} className={i===0?'active':''}>{i===0?'⚛':'◈'} {s}</span>)}</div><div className="curricula">{t.curricula.map(c=><span key={c}>{c}</span>)}</div></div>
          <div className="path-card"><div className="path-head"><div><small>{t.lesson}</small><h3>{t.unit}</h3><span>{t.unitSub}</span></div><div className="path-ring">68%</div></div><div className="lesson-list">{t.lessonRows.map(([name,status],i)=><div key={name} className={i===1?'active':''}><span>{i===0?'✓':i===1?'▶':i===2?'○':'🔒'}</span><strong>{name}</strong><small>{status}</small></div>)}</div></div>
        </div>
      </section>

      <section className="section teachers" id="teachers">
        <div className="container teacher-grid">
          <div className="teacher-art"><div className="teacher-shape"><div className="teacher-silhouette"><span></span><i></i></div></div><div className="verified-badge"><b>✓</b><div><strong>{lang==='en'?'Verified educator':'معلم موثق'}</strong><small>{lang==='en'?'Identity • Qualifications • Expertise':'الهوية • المؤهلات • الخبرة'}</small></div></div><div className="rating-badge"><strong>4.9</strong><span>★★★★★</span><small>{lang==='en'?'Verified reviews':'تقييمات موثقة'}</small></div></div>
          <div className="teacher-copy"><div className="eyebrow mint">{t.teacherEyebrow}</div><h2>{t.teacherTitle}</h2><p>{t.teacherText}</p><ul>{t.teacherPoints.map(x=><li key={x}><span>✓</span>{x}</li>)}</ul><button className="button dark" onClick={() => setModal(true)}>{t.findTeacher}<b>→</b></button></div>
        </div>
      </section>

      <section className="section ai-section" id="ai">
        <div className="container ai-grid">
          <div className="ai-copy"><div className="eyebrow light">{t.aiEyebrow}</div><h2>{t.aiTitle}</h2><p>{t.aiText}</p><div className="safety-note"><span>✓</span>{t.safety}</div></div>
          <div className="chat-card"><div className="chat-head"><div className="ai-avatar"><Icon name="spark"/></div><div><strong>SUCCESS AI Tutor</strong><small><i></i>{lang==='en'?'Grounded learning mode':'وضع التعلم الموثق'}</small></div><span>•••</span></div><div className="chat-body"><div className="bubble user">{t.aiPrompt}</div><div className="bubble ai"><span><Icon name="spark"/></span><div>{t.aiAnswer}<small>{t.aiSource}</small></div></div>{messages.map((m,i)=><React.Fragment key={i}><div className="bubble user">{m.q}</div><div className="bubble ai"><span><Icon name="spark"/></span><div>{m.a}</div></div></React.Fragment>)}</div><form className="chat-input" onSubmit={submitQuestion}><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder={t.aiPlaceholder}/><button aria-label={t.aiSend}>↑</button></form></div>
        </div>
      </section>

      <section className="section passport-section">
        <div className="container passport-grid">
          <div className="passport-copy"><div className="eyebrow mint">{t.passportEyebrow}</div><h2>{t.passportTitle}</h2><p>{t.passportText}</p><div className="passport-list">{t.passportItems.map((x,i)=><div key={x}><span>{['◇','✓','◫','✦'][i]}</span>{x}</div>)}</div></div>
          <div className="passport-visual"><div className="passport-card"><div className="pc-top"><Logo dark/><span>EDU ID<br/><b>000 147 82</b></span></div><div className="pc-user"><div className="pc-avatar">WA</div><div><small>{lang==='en'?'LEARNER':'المتعلم'}</small><h3>Waseem A.</h3><span>{lang==='en'?'International Programs':'البرامج الدولية'}</span></div></div><div className="pc-mastery"><small>{lang==='en'?'VERIFIED MASTERY':'الإتقان الموثق'}</small><div><span>Physics <b>78%</b></span><i><em style={{width:'78%'}}></em></i></div><div><span>Chemistry <b>64%</b></span><i><em style={{width:'64%'}}></em></i></div></div><div className="pc-bottom"><span>◉ {lang==='en'?'Permission controlled':'بصلاحيات محكمة'}</span><b>⌁</b></div></div><div className="passport-glow"></div></div>
        </div>
      </section>

      <section className="cta-section" id="contact"><div className="container cta-card"><div className="cta-orb a"></div><div className="cta-orb b"></div><div className="eyebrow light">{t.ctaEyebrow}</div><h2>{t.ctaTitle}</h2><p>{t.ctaText}</p><div><button className="button mint-button" onClick={()=>setModal(true)}>{t.ctaButton}<b>→</b></button><a className="button clear" href="https://www.success4sureacademy.com/" target="_blank" rel="noreferrer">{t.ctaSecondary}</a></div></div></section>
    </main>

    <footer><div className="container footer-grid"><div className="footer-brand"><Logo/><p>{t.footerText}</p><div className="socials"><a href="https://www.instagram.com/success4surejo/" target="_blank" rel="noreferrer">IG</a><a href="mailto:info@success4sureacademy.com">@</a><a href="https://www.success4sureacademy.com/" target="_blank" rel="noreferrer">↗</a></div></div>{t.footerCols.map(col=><div className="footer-col" key={col[0]}><strong>{col[0]}</strong>{col.slice(1).map(x=><a href="#top" key={x}>{x}</a>)}</div>)}</div><div className="container footer-bottom"><span>{t.rights}</span><span>Amman • Dubai • Online Worldwide</span></div></footer>

    {modal && <div className="modal-backdrop" onMouseDown={(e)=>e.target===e.currentTarget&&setModal(false)}><div className="modal"><button className="modal-close" onClick={()=>setModal(false)}>×</button><Logo dark/><h2>{t.modalTitle}</h2><p>{t.modalText}</p><div className="role-grid">{t.roles.map(([name,desc],i)=><button key={name} className={role===name?'selected':''} onClick={()=>setRole(name)}><span>{['◉','◇','✦','▦'][i]}</span><div><strong>{name}</strong><small>{desc}</small></div><b>→</b></button>)}</div><button className="button modal-next" disabled={!role} onClick={()=>setModal(false)}>{t.modalNext}<b>→</b></button></div></div>}
  </div>;
}

if (typeof document !== 'undefined') {
  createRoot(document.getElementById('root')).render(<App />);
}
