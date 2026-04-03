import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppIcon from '../components/AppIcon';
import MarketWidget from '../components/MarketWidget';
import { fetchHomeConfig } from '../services/api/user';
import cardImg from '../assets/card.png';

export default function HomePage() {
  const [marqueeMessages, setMarqueeMessages] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadHomeConfig = async () => {
      try {
        const response = await fetchHomeConfig();
        const messages = Array.isArray(response?.data?.marqueeMessages)
          ? response.data.marqueeMessages.filter((item) => typeof item === 'string' && item.trim())
          : [];

        if (!cancelled) {
          setMarqueeMessages(messages);
        }
      } catch {
        if (!cancelled) {
          setMarqueeMessages([]);
        }
      }
    };

    void loadHomeConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  const marqueeItems = marqueeMessages.length > 0 ? [...marqueeMessages, ...marqueeMessages] : [];

  return (
    <>
      {marqueeMessages.length > 0 ? (
        <section className="mb-6">
          <div className="announcement-marquee">
            <div className="announcement-marquee__badge">
              <AppIcon icon="mdi:bullhorn-variant-outline" className="text-base" />
              <span>最新播报</span>
            </div>
            <div className="announcement-marquee__viewport">
              <div className="announcement-marquee__track">
                {marqueeItems.map((message, index) => (
                  <div key={`${message}-${index}`} className="announcement-marquee__item">
                    <span className="announcement-marquee__dot" />
                    <span>{message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative grid min-h-[74vh] grid-cols-1 items-center gap-8 overflow-hidden pb-24 md:pb-32 lg:grid-cols-2">
        <div>
          <span className="mb-4 inline-block rounded-full border border-[#ffde99]/60 bg-white/5 px-4 py-2 text-sm text-[#f8e7b3]">
            币安去中心化跟单与分润系统
          </span>
          <h1 className="mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-4xl font-bold leading-tight text-transparent lg:text-6xl">
            100U 开通权限，<span className="bg-gradient-to-r from-[#fff4bf] to-[#d79a28] bg-clip-text text-transparent">一笔交易完成绑定与激活</span>
          </h1>
          <p className="mb-6 text-lg leading-8 text-slate-300">
            用户连接钱包后，通过链上合约完成推荐关系绑定与权限购买。系统基于直推人数与独立市场线自动计算 VIP 晋升，按规则发放直推奖励与极差奖励，支持代理/合伙人独立代单模式。
          </p>
          <div className="mb-4 flex flex-wrap gap-3">
            <a
              href="https://www.binance.com/zh-CN/register"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200"
            >
              币安注册链接
              <AppIcon icon="mdi:open-in-new" className="text-sm" />
            </a>
            <a
              href="https://www.binance.com/zh-CN/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200"
            >
              币安官方下载
              <AppIcon icon="mdi:download" className="text-sm" />
            </a>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fcd535] to-[#b77912] px-5 py-3 text-sm font-semibold text-black "
            >
              进入用户中心开通
              <AppIcon icon="mdi:arrow-right" className="text-base" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white"
            >
              <AppIcon icon="mdi:sitemap-outline" className="text-base" />
              进入用户中心
            </Link>
          </div>
        </div>

        <div className="flex min-h-[320px] items-center justify-center rounded-2xl p-4 sm:min-h-[420px] sm:p-6 lg:min-h-[520px]">
          <div className="hero-orbit-display">
            <img src={cardImg} alt="加密货币主题图" className="hero-coin-image" />
          </div>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <MarketWidget />
      </section>
    </>
  );
}
