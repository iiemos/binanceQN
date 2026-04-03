import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import AppIcon from './AppIcon';
import { shortAddress } from '../utils/address';
import { loginByWallet } from '../services/api/auth';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [connectedAddress, setConnectedAddress] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('wallet_address') || '';
  });
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'zh';
    const saved = window.localStorage.getItem('site_lang');
    return saved === 'en' ? 'en' : 'zh';
  });
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  const t = language === 'en'
    ? {
        brand: 'Genesis AI Quant',
        homeAria: 'Genesis AI Quant — Home',
        navItems: [
          { to: '/', label: 'Home' },
          { to: '/dashboard', label: 'Dashboard' }
        ],
        connectWallet: 'Connect Wallet',
        enterDashboard: 'Go Dashboard',
        walletUnavailable: 'No wallet detected. Please install MetaMask or use a wallet browser.',
        language: 'Language',
        contactAria: 'Contact Us',
        telegramAria: 'Contact via Telegram',
        emailAria: 'Contact via Email',
        supportAria: 'Support Center'
      }
    : {
        brand: '启源 AI 量化',
        homeAria: '启源 AI 量化 — 首页',
        navItems: [
          { to: '/', label: '首页' },
          { to: '/dashboard', label: '用户中心' }
        ],
        connectWallet: '连接钱包',
        enterDashboard: '进入用户中心',
        walletUnavailable: '未检测到钱包插件，请先安装 MetaMask 或使用钱包浏览器。',
        language: '语言切换',
        contactAria: '联系我们',
        telegramAria: 'Telegram 联系我们',
        emailAria: '邮箱联系我们',
        supportAria: '支持中心'
      };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const percent = total > 0 ? (window.scrollY / total) * 100 : 0;
      setProgress(percent);
    };

    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('site_lang', language);
    }
  }, [language]);

  useEffect(() => {
    setLangMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!langMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [langMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum?.request) return undefined;

    const ensureWalletSession = async (address) => {
      if (!address) {
        window.localStorage.removeItem('user_token');
        window.localStorage.removeItem('user_role');
        return;
      }

      try {
        const response = await loginByWallet(address, 'wallet-connect-signature');
        const data = response?.data || {};
        if (data.token) {
          window.localStorage.setItem('user_token', data.token);
        }
        if (data.role) {
          window.localStorage.setItem('user_role', data.role);
        }
      } catch {
        // ignore auth sync failures to avoid blocking wallet UI
      }
    };

    const syncWallet = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const address = Array.isArray(accounts) ? accounts[0] || '' : '';
        setConnectedAddress(address);
        if (address) {
          window.localStorage.setItem('wallet_address', address);
        }
        await ensureWalletSession(address);
      } catch {
        setConnectedAddress('');
      }
    };

    const handleAccountsChanged = (accounts) => {
      const address = Array.isArray(accounts) ? accounts[0] || '' : '';
      setConnectedAddress(address);
      if (address) {
        window.localStorage.setItem('wallet_address', address);
      } else {
        window.localStorage.removeItem('wallet_address');
      }
      void ensureWalletSession(address);
    };

    void syncWallet();
    window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    return () => window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
  }, []);

  const handleConnectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum?.request) {
      window.alert(t.walletUnavailable);
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = Array.isArray(accounts) ? accounts[0] || '' : '';
      setConnectedAddress(address);
      if (address) {
        window.localStorage.setItem('wallet_address', address);
        const response = await loginByWallet(address, 'wallet-connect-signature');
        const data = response?.data || {};
        if (data.token) {
          window.localStorage.setItem('user_token', data.token);
        }
        if (data.role) {
          window.localStorage.setItem('user_role', data.role);
        }
      }
    } catch {
      // user rejected or wallet unavailable
    }
  };

  const handleWalletAction = async () => {
    if (connectedAddress) {
      navigate('/dashboard');
      return;
    }
    await handleConnectWallet();
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('wallet_address');
      window.localStorage.removeItem('user_token');
      window.localStorage.removeItem('user_role');
    }
    setConnectedAddress('');
    navigate('/');
  };

  const showBackgroundAnimation = location.pathname !== '/dashboard';

  if (location.pathname === '/dashboard-backup') {
    return <>{children}</>;
  }

  return (
    <>
      <div
        id="scrollProgress"
        className="fixed top-0 left-0 h-[3px] z-[2000] bg-gradient-to-r from-[#fff4bf] via-[#e9b949] to-[#b77912] transition-[width] duration-75"
        style={{ width: `${progress}%` }}
      />

      {showBackgroundAnimation ? (
        <div className="bg-animation">
          <div className="floating-orb orb1" />
          <div className="floating-orb orb2" />
          <div className="floating-orb orb3" />
        </div>
      ) : null}

      <nav
        className={`fixed top-0 left-0 right-0 z-[1200] border-b border-white/10 backdrop-blur-xl transition-all duration-300 ${
          scrolled ? 'py-2 bg-[rgba(8,8,18,0.95)]' : 'py-3 bg-[rgba(8,8,18,0.7)]'
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4">
          <div className="inline-flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-[#fff4bf] to-[#d79a28] bg-clip-text text-transparent">
            <AppIcon icon="mdi:link-variant" className="text-xl" />
            {t.brand}
          </div>

          <ul className="hidden items-center gap-5 lg:flex">
            {t.navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `text-sm transition-colors ${isActive ? 'text-white' : 'text-slate-300 hover:text-white'}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <div ref={langMenuRef} className="relative hidden md:block">
              <button
                type="button"
                aria-label={t.language}
                aria-haspopup="menu"
                aria-expanded={langMenuOpen}
                onClick={() => setLangMenuOpen((value) => !value)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-slate-100 transition-colors hover:text-white"
              >
                <AppIcon icon="mdi:translate" className="text-sm" />
              </button>
              {langMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[1400] min-w-[150px] rounded-xl border border-white/15 bg-[rgba(8,8,18,0.96)] p-1 shadow-2xl backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('zh');
                      setLangMenuOpen(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      language === 'zh' ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    简体中文
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en');
                      setLangMenuOpen(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      language === 'en' ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              title={connectedAddress ? '退出登录' : t.connectWallet}
              onClick={connectedAddress ? handleLogout : () => void handleWalletAction()}
              className={
                connectedAddress
                  ? 'inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 text-xs font-mono font-medium tracking-tight text-slate-100 transition-colors hover:text-white'
                  : 'inline-flex rounded-full bg-gradient-to-r from-[#fcd535] to-[#b77912] px-3 py-2 text-xs font-semibold text-black md:px-5 md:text-sm'
              }
            >
              {connectedAddress ? (
                <>
                  <span className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span>{shortAddress(connectedAddress, 6, 4)}</span>
                  <AppIcon icon="mdi:logout" className="text-sm opacity-80" />
                </>
              ) : (
                t.connectWallet
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="px-4 pb-8 pt-28">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>

      <footer className="mt-10 border-t border-white/10 bg-[rgba(8,8,18,0.7)] backdrop-blur-xl" role="contentinfo" aria-label="Site footer">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <NavLink
              to="/"
              aria-label={t.homeAria}
              className="inline-flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-[#fff4bf] to-[#d79a28] bg-clip-text text-transparent"
            >
              <span className="inline-grid h-8 w-8 place-items-center rounded-full bg-gradient-to-r from-[#fcd535] to-[#b77912] text-black">
                <AppIcon icon="mdi:link-variant" className="text-base" />
              </span>
              {t.brand}
            </NavLink>

            <div className="flex flex-col gap-3 sm:items-end">
              <div className="flex items-center gap-2" aria-label={t.contactAria}>
                <a
                  href="https://t.me/genesis_quant_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.telegramAria}
                  className="inline-grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-slate-200 transition-colors hover:text-white"
                >
                  <AppIcon icon="mdi:telegram" className="text-base" />
                </a>
                <a
                  href="mailto:support@genesis-ai-quant.example"
                  aria-label={t.emailAria}
                  className="inline-grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-slate-200 transition-colors hover:text-white"
                >
                  <AppIcon icon="mdi:email-outline" className="text-base" />
                </a>
                <NavLink
                  to="/profile"
                  aria-label={t.supportAria}
                  className="inline-grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-slate-200 transition-colors hover:text-white"
                >
                  <AppIcon icon="mdi:headset" className="text-base" />
                </NavLink>
              </div>
              <div className="text-xs text-slate-400">© {new Date().getFullYear()} {t.brand}. All rights reserved.</div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
