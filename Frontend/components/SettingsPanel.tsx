import React from "react";
import { Bell, BellOff, LogIn, LogOut, MoonStar, SunMedium, X } from "lucide-react";

type Language = "en" | "es" | "pt" | "it" | "ja" | "zh";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  soundsEnabled: boolean;
  onSoundsChange: (enabled: boolean) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  loginEmail: string;
  onEmailChange: (value: string) => void;
  loginPassword: string;
  onPasswordChange: (value: string) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  soundsEnabled,
  onSoundsChange,
  isLoggedIn,
  onLogin,
  onLogout,
  loginEmail,
  onEmailChange,
  loginPassword,
  onPasswordChange,
  language,
  onLanguageChange,
}) => {
  if (!isOpen) return null;

  const translations = {
    en: {
      title: "Preferences",
      heading: "Settings",
      appearanceTitle: "Appearance",
      appearanceDescription: "Switch between a light and dark workspace.",
      light: "Light",
      dark: "Dark",
      soundsTitle: "Sounds",
      soundsDescription: "Enable subtle audio cues for alerts and actions.",
      soundOn: "Sound On",
      soundOff: "Sound Off",
      accountTitle: "Account",
      accountDescription: "Sign in to personalize your workspace.",
      signedIn: "Signed in",
      guest: "Guest",
      emailPlaceholder: "Email address",
      passwordPlaceholder: "Password",
      login: "Log in",
      logout: "Log out",
      welcome: "Welcome back",
      languageTitle: "Language",
      languageDescription: "Choose your interface language.",
      languageLabel: "Language",
    },
    es: {
      title: "Preferencias",
      heading: "Configuración",
      appearanceTitle: "Apariencia",
      appearanceDescription: "Cambia entre un espacio de trabajo claro y oscuro.",
      light: "Claro",
      dark: "Oscuro",
      soundsTitle: "Sonidos",
      soundsDescription: "Activa señales de audio sutiles para alertas y acciones.",
      soundOn: "Sonido activado",
      soundOff: "Sonido desactivado",
      accountTitle: "Cuenta",
      accountDescription: "Inicia sesión para personalizar tu espacio.",
      signedIn: "Conectado",
      guest: "Invitado",
      emailPlaceholder: "Correo electrónico",
      passwordPlaceholder: "Contraseña",
      login: "Iniciar sesión",
      logout: "Cerrar sesión",
      welcome: "Bienvenido de nuevo",
      languageTitle: "Idioma",
      languageDescription: "Elige el idioma de la interfaz.",
      languageLabel: "Idioma",
    },
    pt: {
      title: "Preferências",
      heading: "Configurações",
      appearanceTitle: "Aparência",
      appearanceDescription: "Alternar entre um ambiente claro e escuro.",
      light: "Claro",
      dark: "Escuro",
      soundsTitle: "Som",
      soundsDescription: "Ative sinais sonoros sutis para alertas e ações.",
      soundOn: "Som ativado",
      soundOff: "Som desativado",
      accountTitle: "Conta",
      accountDescription: "Entre para personalizar seu espaço.",
      signedIn: "Conectado",
      guest: "Convidado",
      emailPlaceholder: "Endereço de e-mail",
      passwordPlaceholder: "Senha",
      login: "Entrar",
      logout: "Sair",
      welcome: "Bem-vindo de volta",
      languageTitle: "Idioma",
      languageDescription: "Escolha o idioma da interface.",
      languageLabel: "Idioma",
    },
    it: {
      title: "Preferenze",
      heading: "Impostazioni",
      appearanceTitle: "Aspetto",
      appearanceDescription: "Passa da un ambiente chiaro a uno scuro.",
      light: "Chiaro",
      dark: "Scuro",
      soundsTitle: "Suoni",
      soundsDescription: "Abilita segnali audio sottili per avvisi e azioni.",
      soundOn: "Suono attivo",
      soundOff: "Suono disattivo",
      accountTitle: "Account",
      accountDescription: "Accedi per personalizzare il tuo spazio.",
      signedIn: "Accesso eseguito",
      guest: "Ospite",
      emailPlaceholder: "Indirizzo e-mail",
      passwordPlaceholder: "Password",
      login: "Accedi",
      logout: "Esci",
      welcome: "Bentornato",
      languageTitle: "Lingua",
      languageDescription: "Scegli la lingua dell'interfaccia.",
      languageLabel: "Lingua",
    },
    ja: {
      title: "環境設定",
      heading: "設定",
      appearanceTitle: "外観",
      appearanceDescription: "ライトモードとダークモードを切り替えます。",
      light: "ライト",
      dark: "ダーク",
      soundsTitle: "サウンド",
      soundsDescription: "アラートや操作のための微かな音声通知を有効にします。",
      soundOn: "サウンドON",
      soundOff: "サウンドOFF",
      accountTitle: "アカウント",
      accountDescription: "ログインしてワークスペースをカスタマイズします。",
      signedIn: "ログイン済み",
      guest: "ゲスト",
      emailPlaceholder: "メールアドレス",
      passwordPlaceholder: "パスワード",
      login: "ログイン",
      logout: "ログアウト",
      welcome: "おかえりなさい",
      languageTitle: "言語",
      languageDescription: "インターフェース言語を選択してください。",
      languageLabel: "言語",
    },
    zh: {
      title: "偏好设置",
      heading: "设置",
      appearanceTitle: "外观",
      appearanceDescription: "在浅色和深色工作区之间切换。",
      light: "浅色",
      dark: "深色",
      soundsTitle: "声音",
      soundsDescription: "为警报和操作启用细微的音频提示。",
      soundOn: "声音已开启",
      soundOff: "声音已关闭",
      accountTitle: "账户",
      accountDescription: "登录以个性化您的工作区。",
      signedIn: "已登录",
      guest: "访客",
      emailPlaceholder: "电子邮件地址",
      passwordPlaceholder: "密码",
      login: "登录",
      logout: "退出登录",
      welcome: "欢迎回来",
      languageTitle: "语言",
      languageDescription: "选择界面语言。",
      languageLabel: "语言",
    },
  };

  const t = translations[language];
  const languageOptions: Array<{ value: Language; label: string }> = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "pt", label: "Português" },
    { value: "it", label: "Italiano" },
    { value: "ja", label: "日本語" },
    { value: "zh", label: "中文" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">{t.title}</p>
            <h2 className="text-xl font-bold text-slate-900">{t.heading}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{t.appearanceTitle}</p>
                <p className="text-sm text-slate-500">{t.appearanceDescription}</p>
              </div>
              <div className="rounded-full bg-white p-1 shadow-sm">
                {theme === "light" ? (
                  <SunMedium className="h-4 w-4 text-amber-500" />
                ) : (
                  <MoonStar className="h-4 w-4 text-indigo-600" />
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onThemeChange("light")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  theme === "light"
                    ? "border-indigo-500 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {t.light}
              </button>
              <button
                onClick={() => onThemeChange("dark")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  theme === "dark"
                    ? "border-indigo-500 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {t.dark}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{t.soundsTitle}</p>
                <p className="text-sm text-slate-500">{t.soundsDescription}</p>
              </div>
              <div className="rounded-full bg-white p-2 shadow-sm">
                {soundsEnabled ? <Bell className="h-4 w-4 text-indigo-600" /> : <BellOff className="h-4 w-4 text-slate-500" />}
              </div>
            </div>
            <button
              onClick={() => onSoundsChange(!soundsEnabled)}
              className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition ${
                soundsEnabled
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {soundsEnabled ? t.soundOn : t.soundOff}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{t.languageTitle}</p>
                <p className="text-sm text-slate-500">{t.languageDescription}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {languageOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onLanguageChange(option.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    language === option.value
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{t.accountTitle}</p>
                <p className="text-sm text-slate-500">{t.accountDescription}</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isLoggedIn ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                {isLoggedIn ? t.signedIn : t.guest}
              </div>
            </div>

            {!isLoggedIn ? (
              <div className="space-y-2">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => onEmailChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-indigo-500"
                  placeholder={t.emailPlaceholder}
                />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-indigo-500"
                  placeholder={t.passwordPlaceholder}
                />
                <button
                  onClick={onLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <LogIn className="h-4 w-4" />
                  {t.login}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {t.welcome}, {loginEmail || "analyst"}.
                </div>
                <button
                  onClick={onLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4" />
                  {t.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
