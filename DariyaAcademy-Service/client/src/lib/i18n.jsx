import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from './api.js'

const UI_LANGS = ['darija', 'ar', 'fr']
const UI_KEY = 'dariya.ui'
const THEME_KEY = 'dariya.theme'

const DICT = {
  darija: {
    dir: 'rtl',
    brand: 'دارها أكاديمي',
    tagline: 'رجع للغة ديالك',
    nav: { home: 'الرئيسية', courses: 'اللغات', glossary: 'المسرد', progress: 'التقدم', settings: 'الإعدادات' },
    common: {
      start: 'بدا', continue: 'كمّل', login: 'سجل دخول', register: 'سجل', logout: 'خرج',
      demo: 'جرّب الديمو', loading: 'كحمل…', back: 'رجوع', next: 'التالي', save: 'سجل',
      minutes: 'دقيقة', lesson: 'درس', lessons: 'دروس', xp: 'نقطة', done: 'تكمّل', search: 'قلب',
      level: 'المستوى', all: 'الكل', loadingError: 'مقدرناش نجيبو المعطيات', retry: 'عاود',
      speak: 'سمع', listen: 'سمع', stop: 'وقف', you: 'نتا', free: 'مجاني', open: 'حل',
    },
    home: {
      heroTitle: 'الدارجة ديال جدّك ما خاصهاش تضيع',
      heroText: 'دروس قصيرة، تمارين، ونطق. للولاد ديال المغاربة اللي بغاو يرجعو للغة العائلة.',
      cta: 'بدا دابا', ctaSecondary: 'شوف اللغات',
      whyTitle: 'علاش دارها أكاديمي؟',
      why: [
        ['⏱️', 'دروس قصيرة', 'من 5 لـ 10 دقايق، تقدر تخدم حتى فـ الطريق.'],
        ['🗣️', 'نطق وطلاقة', 'سمع الكلمة، عاودها، ونتا كتسجل صوتك.'],
        ['📖', 'شرح بالدارجة', 'القواعد مفسّرة بالدارجة، ماشي بلغة رسمية صعيبة.'],
        ['🗂️', 'مسرد', 'كل الكلمات مجمّعة فـ بلاصة وحدة.'],
      ],
      pickLanguage: 'شوف أشمن لغة بغيتي',
    },
    auth: {
      loginTitle: 'سجل دخول', registerTitle: 'دير حساب جديد',
      name: 'السمية', email: 'الإيميل', password: 'الباسوورد', country: 'البلد',
      goal: 'الهدف ديالك فـ النهار (دقايق)', target: 'اللغات لي بغيتي تتعلم',
      haveAccount: 'عندك حساب؟', noAccount: 'ما عندكش حساب؟',
      welcome: 'مرحبا بيك', tryDemo: 'ولا جرّب بالحساب ديال الديمو',
    },
    course: {
      lessonsCount: 'عدد الدروس', exercises: 'التمارين', about: 'شنو غادي تتعلم',
      noLessons: 'ما كايناش دروس فهاد المستوى بعد.',
    },
    lesson: {
      readFirst: 'قرا القسم الأول', vocab: 'المفردات', example: 'أمثلة', practice: 'التمرين',
      startQuiz: 'بدا التمارين', finish: 'ساليت الدرس', backToCourse: 'رجوع للكورس',
      goal: 'الهدف', all: 'الكل {n} تمارين', exitQuiz: 'خرج بلا ما تسجل',
    },
    quiz: {
      q: 'التمرين {i} من {n}', check: 'تحقق', next: 'التالي', finish: 'سالي',
      correct: 'مزيان!', wrong: 'ماشي مزيان', tryAgain: 'عاود جرب',
      type: { mcq: 'اختار', fill: 'كمّل الفراغ', translate: 'ترجم', listen: 'سمع وختار', speak: 'تكلم', order: 'رتّب' },
      results: 'النتيجة ديالك',
      score: 'النقطة', accuracy: 'الدقة', earned: 'كسبتي', finishBonus: 'مكافأة الدرس',
      streak: 'سلسلة', again: 'عاود الدرس', goHome: 'رجع للرئيسية', review: 'شوف الشرح',
    },
    glossary: {
      title: 'المسرد', searchPlaceholder: 'قلب على كلمة…',
      empty: 'ما لقينا حتى كلمة.', count: '{n} كلمة',
    },
    progress: {
      title: 'التقدم ديالك', lessonsDone: 'دروس تكمّلت', answered: 'تمارين جاوبتي',
      accuracy: 'الدقة', streak: 'سلسلة الأيام', best: 'أحسن سلسلة', xp: 'نقطة',
      perCourse: 'حسب اللغة', level: 'المستوى {lvl}', of: 'من', notStarted: 'ما بديتيش',
    },
    settings: {
      title: 'الإعدادات', uiLanguage: 'لغة التطبيق', theme: 'المظهر',
      light: 'نهار', dark: 'ليل', account: 'الحساب', danger: 'مسح حسابك',
      langNote: 'لغة الشرح والتطبيق. المحتوى ديال كل درس كتبقى فـ لغتها.',
    },
  },
  ar: {
    dir: 'rtl',
    brand: 'داريا أكاديمي',
    tagline: 'استعد لغة العائلة',
    nav: { home: 'الرئيسية', courses: 'اللغات', glossary: 'المسرد', progress: 'التقدم', settings: 'الإعدادات' },
    common: {
      start: 'ابدأ', continue: 'متابعة', login: 'تسجيل الدخول', register: 'إنشاء حساب', logout: 'تسجيل الخروج',
      demo: 'جرّب النسخة التجريبية', loading: 'جارٍ التحميل…', back: 'رجوع', next: 'التالي', save: 'حفظ',
      minutes: 'دقيقة', lesson: 'درس', lessons: 'دروس', xp: 'نقطة', done: 'مكتمل', search: 'بحث',
      level: 'المستوى', all: 'الكل', loadingError: 'تعذّر تحميل البيانات', retry: 'إعادة المحاولة',
      speak: 'استماع', listen: 'استمع', stop: 'إيقاف', you: 'أنت', free: 'مجاني', open: 'ابدأ',
    },
    home: {
      heroTitle: 'لغة أجدادك لا يجب أن تضيع',
      heroText: 'دروس قصيرة، تمارين، ونطق. لأبناء المغاربة الذين يريدون استعادة لغة العائلة.',
      cta: 'ابدأ الآن', ctaSecondary: 'تصفح اللغات',
      whyTitle: 'لماذا داريا أكاديمي؟',
      why: [
        ['⏱️', 'دروس قصيرة', 'من 5 إلى 10 دقائق، حتى في الطريق.'],
        ['🗣️', 'النطق والطلاقة', 'استمع، كرّر، وسجّل صوتك.'],
        ['📖', 'شرح بالدارجة', 'القواعد مشروحة بالدارجة لا بلغة رسمية صعبة.'],
        ['🗂️', 'مسرد', 'كل الكلمات مجمّعة في مكان واحد.'],
      ],
      pickLanguage: 'اختر اللغة التي تريد',
    },
    auth: {
      loginTitle: 'تسجيل الدخول', registerTitle: 'إنشاء حساب جديد',
      name: 'الاسم', email: 'البريد الإلكتروني', password: 'كلمة المرور', country: 'البلد',
      goal: 'هدفك اليومي (بالدقائق)', target: 'اللغات التي تريد تعلمها',
      haveAccount: 'لديك حساب؟', noAccount: 'ليس لديك حساب؟',
      welcome: 'أهلاً بك', tryDemo: 'أو جرّب بالحساب التجريبي',
    },
    course: {
      lessonsCount: 'عدد الدروس', exercises: 'التمارين', about: 'ماذا ستتعلم',
      noLessons: 'لا توجد دروس في هذا المستوى بعد.',
    },
    lesson: {
      readFirst: 'اقرأ القسم الأول', vocab: 'المفردات', example: 'أمثلة', practice: 'التمرين',
      startQuiz: 'ابدأ التمارين', finish: 'أنهيت الدرس', backToCourse: 'رجوع للكورس',
      goal: 'الهدف', all: 'كل التمارين {n}', exitQuiz: 'الخروج دون تسجيل',
    },
    quiz: {
      q: 'التمرين {i} من {n}', check: 'تحقق', next: 'التالي', finish: 'إنهاء',
      correct: 'أحسنت!', wrong: 'ليس صحيحاً', tryAgain: 'حاول مرة أخرى',
      type: { mcq: 'اختر', fill: 'أكمل الفراغ', translate: 'ترجم', listen: 'استمع واختر', speak: 'تحدث', order: 'رتّب' },
      results: 'نتيجتك',
      score: 'النقطة', accuracy: 'الدقة', earned: 'ربحت', finishBonus: 'مكافأة الدرس',
      streak: 'سلسلة', again: 'أعد الدرس', goHome: 'العودة للرئيسية', review: 'اقرأ الشرح',
    },
    glossary: {
      title: 'المسرد', searchPlaceholder: 'ابحث عن كلمة…',
      empty: 'لم نجد أي كلمة.', count: '{n} كلمة',
    },
    progress: {
      title: 'تقدّمك', lessonsDone: 'دروس مكتملة', answered: 'تمارين أجبت عنها',
      accuracy: 'الدقة', streak: 'سلسلة الأيام', best: 'أفضل سلسلة', xp: 'نقطة',
      perCourse: 'حسب اللغة', level: 'المستوى {lvl}', of: 'من', notStarted: 'لم تبدأ',
    },
    settings: {
      title: 'الإعدادات', uiLanguage: 'لغة التطبيق', theme: 'المظهر',
      light: 'نهاري', dark: 'ليلي', account: 'الحساب', danger: 'مسح حسابك',
      langNote: 'لغة الشرح والتطبيق. يبقى محتوى كل درس بلغته.',
    },
  },
  fr: {
    dir: 'ltr',
    brand: 'Dariya Academy',
    tagline: 'Retrouvez la langue de votre famille',
    nav: { home: 'Accueil', courses: 'Langues', glossary: 'Lexique', progress: 'Progrès', settings: 'Réglages' },
    common: {
      start: 'Commencer', continue: 'Continuer', login: 'Se connecter', register: "S'inscrire", logout: 'Déconnexion',
      demo: 'Essayer la démo', loading: 'Chargement…', back: 'Retour', next: 'Suivant', save: 'Enregistrer',
      minutes: 'min', lesson: 'leçon', lessons: 'leçons', xp: 'XP', done: 'terminé', search: 'Rechercher',
      level: 'Niveau', all: 'Tout', loadingError: 'Impossible de charger les données', retry: 'Réessayer',
      speak: 'Écouter', listen: 'Écouter', stop: 'Arrêter', you: 'vous', free: 'gratuit', open: 'Commencer',
    },
    home: {
      heroTitle: "La langue de vos grands-parents ne doit pas se perdre",
      heroText: "Des leçons courtes, des exercices et de la parole. Pour les enfants de la diaspora qui veulent retrouver la langue de la famille.",
      cta: 'Commencer', ctaSecondary: 'Voir les langues',
      whyTitle: 'Pourquoi Dariya Academy ?',
      why: [
        ['⏱️', 'Leçons courtes', 'De 5 à 10 minutes, même dans le transport.'],
        ['🗣️', 'Parole et fluidité', 'Écoutez, répétez, et votre voix est enregistrée.'],
        ['📖', 'Explications en darija', 'Les règles expliquées simplement, pas en jargon.'],
        ['🗂️', 'Lexique', 'Tous les mots réunis au même endroit.'],
      ],
      pickLanguage: 'Choisissez votre langue',
    },
    auth: {
      loginTitle: 'Connexion', registerTitle: 'Créer un compte',
      name: 'Nom', email: 'E-mail', password: 'Mot de passe', country: 'Pays',
      goal: 'Objectif quotidien (minutes)', target: 'Langues à apprendre',
      haveAccount: 'Déjà un compte ?', noAccount: "Pas encore de compte ?",
      welcome: 'Bienvenue', tryDemo: 'Ou essayez le compte démo',
    },
    course: {
      lessonsCount: 'Nombre de leçons', exercises: 'Exercices', about: 'Ce que vous allez apprendre',
      noLessons: 'Pas encore de leçons à ce niveau.',
    },
    lesson: {
      readFirst: "Lisez d'abord la section", vocab: 'Vocabulaire', example: 'Exemples', practice: 'Exercice',
      startQuiz: 'Commencer les exercices', finish: 'Leçon terminée', backToCourse: 'Retour au cours',
      goal: 'Objectif', all: 'Les {n} exercices', exitQuiz: 'Quitter sans enregistrer',
    },
    quiz: {
      q: 'Exercice {i} sur {n}', check: 'Vérifier', next: 'Suivant', finish: 'Terminer',
      correct: 'Bravo !', wrong: 'Pas tout à fait', tryAgain: 'Réessayer',
      type: { mcq: 'Choisissez', fill: 'Complétez', translate: 'Traduisez', listen: 'Écoutez et choisissez', speak: 'Parlez', order: 'Remettez en ordre' },
      results: 'Votre résultat',
      score: 'Score', accuracy: 'Précision', earned: 'Gagné', finishBonus: 'Bonus de leçon',
      streak: 'Série', again: 'Refaire la leçon', goHome: "Retour à l'accueil", review: "Lire l'explication",
    },
    glossary: {
      title: 'Lexique', searchPlaceholder: 'Chercher un mot…',
      empty: 'Aucun mot trouvé.', count: '{n} mots',
    },
    progress: {
      title: 'Vos progrès', lessonsDone: 'Leçons terminées', answered: 'Exercices traités',
      accuracy: 'Précision', streak: 'Jours de suite', best: 'Meilleure série', xp: 'XP',
      perCourse: 'Par langue', level: 'Niveau {lvl}', of: 'sur', notStarted: 'Pas commencé',
    },
    settings: {
      title: 'Réglages', uiLanguage: "Langue de l'interface", theme: 'Thème',
      light: 'Clair', dark: 'Sombre', account: 'Compte', danger: 'Supprimer mon compte',
      langNote: "Langue de l'interface. Le contenu de chaque leçon reste dans sa langue.",
    },
  },
}

const FALLBACK = 'darija'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [ui, setUi] = useState(() => {
    let saved = null
    try {
      saved = localStorage.getItem(UI_KEY)
    } catch {
      saved = null
    }
    if (saved && UI_LANGS.includes(saved)) return saved
    const nav = (navigator.language || '').toLowerCase()
    return nav.startsWith('fr') ? 'fr' : nav.startsWith('ar') ? 'ar' : FALLBACK
  })

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.lang = ui === 'fr' ? 'fr' : 'ar'
    document.documentElement.dir = DICT[ui].dir
    try {
      localStorage.setItem(UI_KEY, ui)
    } catch {
      /* ignore */
    }
  }, [ui])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const t = useMemo(() => {
    const dict = DICT[ui] || DICT[FALLBACK]
    /** t('quiz.type.mcq', { n: 3 }) */
    const fn = (key, vars) => {
      const value = key.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), dict)
      if (typeof value !== 'string') return key
      if (!vars) return value
      return value.replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined ? m : String(vars[name])))
    }
    fn.lang = ui
    fn.dir = dict.dir
    return fn
  }, [ui])

  return (
    <I18nContext.Provider value={{ ui, setUi, theme, setTheme, t, langs: UI_LANGS }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!getToken()) {
      setReady(true)
      return
    }
    api
      .me()
      .then((r) => {
        if (!cancelled) setUser(r.user)
      })
      .catch(() => {
        setToken(null)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const r = await api.login(email, password)
    setToken(r.token)
    setUser(r.user)
    return r.user
  }, [])

  const register = useCallback(async (payload) => {
    const r = await api.register(payload)
    setToken(r.token)
    setUser(r.user)
    return r.user
  }, [])

  const demo = useCallback(async () => {
    const r = await api.demo()
    setToken(r.token)
    setUser(r.user)
    return r.user
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const r = await api.me()
    setUser(r.user)
    return r.user
  }, [])

  const patch = useCallback(async (body) => {
    const r = await api.updateMe(body)
    setUser(r.user)
    return r.user
  }, [])

  return (
    <AuthContext.Provider value={{ user, ready, login, register, demo, logout, refresh, patch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
