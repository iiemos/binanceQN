import { Link } from 'react-router-dom';
import CountUp from '../components/CountUp';
import AppIcon from '../components/AppIcon';
// import heroCoin from '../assets/bitcoin-1.png';
import cardImg from '../assets/card.png';
import topImg from '../assets/top.webp';
import topArrowImg from '../assets/topArrow.webp';
import bookImg from '../assets/book.png';
import rocketImg from '../assets/rocket.png';
import setupImg from '../assets/setup.png';

import walletImg from '../assets/wallet.webp';

export default function HomePage() {
  return (
    <>
      <section className="relative grid min-h-[74vh] grid-cols-1 items-center gap-8 overflow-hidden pb-24 md:pb-32 lg:grid-cols-2">
        <div>
          <span className="mb-4 inline-block rounded-full border border-[#ffde99]/60 bg-white/5 px-4 py-2 text-sm text-[#f8e7b3]">
            🏅 币安去中心化跟单与分润系统
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

        <div className="flex min-h-[520px] items-center justify-center rounded-2xl p-6">
          <div className="hero-orbit-display">
            <img src={cardImg} alt="加密货币主题图" className="hero-coin-image" />
          </div>
        </div>

      </section>

      <section className="relative my-16 overflow-hidden px-4 py-8 md:my-20 md:px-2 md:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-10 lg:items-center">
          <div className="lg:col-span-5">
            <img
              src={rocketImg}
              alt="核心概览火箭图"
              className="mx-auto h-auto w-full max-w-[420px] object-contain lg:mx-0"
            />
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-primary/10 bg-background-dark/80 p-6 md:p-8">
              <div>
                <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.15em] text-[#f8d66d]">// Protocol Snapshot</span>
                <h2 className="text-4xl font-bold leading-tight md:text-5xl">核心参数概览</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">关键参数集中展示，方便快速确认开通成本、奖励结构和团队统计范围。</p>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                  <div className="mb-2 bg-gradient-to-r from-[#fff4bf] via-[#e9b949] to-[#b77912] bg-clip-text text-4xl font-bold text-transparent">100U</div>
                  <div className="text-sm tracking-wider text-slate-300">单次跟单权限开通费</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                  <div className="mb-2 bg-gradient-to-r from-[#fff4bf] via-[#e9b949] to-[#b77912] bg-clip-text text-4xl font-bold text-transparent">75%</div>
                  <div className="text-sm tracking-wider text-slate-300">市场奖励总拨出</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                  <div className="mb-2 bg-gradient-to-r from-[#fff4bf] via-[#e9b949] to-[#b77912] bg-clip-text text-4xl font-bold text-transparent">40%</div>
                  <div className="text-sm tracking-wider text-slate-300">直推奖励比例</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                  <div className="mb-2 bg-gradient-to-r from-[#fff4bf] via-[#e9b949] to-[#b77912] bg-clip-text text-4xl font-bold text-transparent">30 层</div>
                  <div className="text-sm tracking-wider text-slate-300">极差统计层级上限</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="discover" className="py-24 md:py-32">
        <div className="mx-auto max-w-[700px] text-center">
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.15em] text-[#f8d66d]">// Core Features</span>
          <h2 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">
            围绕购买、绑定、升级、分润<br />构建可审计业务闭环
          </h2>
          <p className="text-lg leading-8 text-slate-300">
            链上合约负责购买、升级、扣款和奖励发放，链下服务负责码池管理、晋升计算与数据同步，前端实时展示用户状态与奖励明细。
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-4">
          <article className=" rounded-3xl border border-primary/10 p-6 ">
            <div className="mx-auto mb-4 inline-grid h-20 w-20 place-items-center rounded-2xl border border-primary/10 text-4xl text-[#f8d66d]">
              <AppIcon icon="ic:round-supervisor-account" />
            </div>
            <h3 className="mb-2 text-xl font-bold">购买即绑定推荐关系</h3>
            <p className="mb-4 text-sm leading-7 text-slate-300">
              首次开通权限必须传入推荐人地址，交易内完成推荐绑定、100U 扣款与激活。绑定后不可逆，后续购买自动沿用已绑定关系。
            </p>
            <span className="inline-flex rounded-full bg-[#f8d66d]/20 px-3 py-1 text-xs font-semibold tracking-wide text-[#f8d66d]">purchaseAndBind</span>
          </article>

          <article className=" rounded-3xl border border-primary/10 p-6">
            <div className="mx-auto mb-4 inline-grid h-20 w-20 place-items-center rounded-2xl border border-primary/10 text-4xl text-[#f8d66d]">
              <AppIcon icon="mdi:qrcode-scan" />
            </div>
            <h3 className="mb-2 text-xl font-bold">跟单码池与代理覆盖</h3>
            <p className="mb-4 text-sm leading-7 text-slate-300">
              系统按未使用-已分配-已使用管理跟单码；若上级为代理或合伙人且已配置个人码，下级将直接领取专属码，不占用公共码池。
            </p>
            <span className="inline-flex rounded-full bg-[#f8d66d]/20 px-3 py-1 text-xs font-semibold tracking-wide text-[#f8d66d]">Code Pool</span>
          </article>

          <article className=" rounded-3xl border border-primary/10 p-6">
            <div className="mx-auto mb-4 inline-grid h-20 w-20 place-items-center rounded-2xl border border-primary/10  text-4xl text-[#f8d66d]">
              <AppIcon icon="mdi:percent-box-outline" />
            </div>
            <h3 className="mb-2 text-xl font-bold">40% 直推 + 35% 极差</h3>
            <p className="mb-4 text-sm leading-7 text-slate-300">
              所有奖励基于 100U 权限费、VIP3/VIP5 首付与分期还款金额计算。VIP1~VIP5 按等级差参与极差分配，统计深度限制在 30 层内。
            </p>
            <span className="inline-flex rounded-full bg-[#f8d66d]/20 px-3 py-1 text-xs font-semibold tracking-wide text-[#f8d66d]">75% Reward Pool</span>
          </article>

          <article className=" rounded-3xl border border-primary/10 p-6">
            <div className="mx-auto mb-4 inline-grid h-20 w-20 place-items-center rounded-2xl border border-primary/10 text-4xl text-[#f8d66d]">
              <AppIcon icon="mdi:cash-clock" />
            </div>
            <h3 className="mb-2 text-xl font-bold">主动升级与分期扣款</h3>
            <p className="mb-4 text-sm leading-7 text-slate-300">
              可主动支付升级 VIP3/VIP5，先付 20% 首付获得权限，后续动态奖励超出首付部分按 20% 自动扣款，直至订单还清。
            </p>
            <span className="inline-flex rounded-full bg-[#f8d66d]/20 px-3 py-1 text-xs font-semibold tracking-wide text-[#f8d66d]">Installment 20%</span>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-28 md:py-36">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-10 lg:items-center">
          <div className="space-y-5 lg:col-span-6">
            <div className="rounded-xl border border-primary/10 bg-background-dark/80 p-6 md:p-7">
              <h2 className="mb-4 text-3xl font-black">VIP 主动升级看板</h2>
              <p className="mb-8 text-slate-400">支持链上主动升级 VIP3/VIP5。支付首付后立即解锁对应身份，后续奖励自动执行分期扣款与状态同步。</p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-primary text-3xl font-black">600 / 3000</div>
                  <div className="mt-1 text-xs font-bold uppercase text-slate-500">VIP3 首付 / 总额(U)</div>
                </div>
                <div>
                  <div className="text-primary text-3xl font-black">2000 / 10000</div>
                  <div className="mt-1 text-xs font-bold uppercase text-slate-500">VIP5 首付 / 总额(U)</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-primary/10 bg-background-dark/80 p-6">
              <div className="mb-6 flex items-center justify-between">
                <span className="font-bold">实时协议事件</span>
                <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs">Live</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 border-b border-primary/5 pb-4">
                  <div className="bg-primary/20 flex size-8 items-center justify-center rounded-full text-xs font-bold">JD</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">User 0x42...F92</div>
                    <div className="text-[10px] uppercase text-slate-500">首次购买并完成推荐绑定</div>
                  </div>
                  <div className="text-primary text-sm font-black">100 U</div>
                </div>
                <div className="flex items-center gap-4 border-b border-primary/5 pb-4">
                  <div className="bg-primary/20 flex size-8 items-center justify-center rounded-full text-xs font-bold">AK</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">User 0x18...B22</div>
                    <div className="text-[10px] uppercase text-slate-500">主动升级 VIP3（代理权限）</div>
                  </div>
                  <div className="text-primary text-sm font-black">600 U</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 flex size-8 items-center justify-center rounded-full text-xs font-bold">MC</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">User 0x99...A11</div>
                    <div className="text-[10px] uppercase text-slate-500">动态奖励触发分期扣款</div>
                  </div>
                  <div className="text-primary text-sm font-black">20%</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center lg:col-span-4 lg:justify-end">
            <img alt="Network Growth" className="h-auto w-full max-w-[360px] object-contain" src={bookImg} />
          </div>
        </div>
      </section>

      <section className="my-16 rounded-3xl bg-gradient-to-r from-[#8b5cf6]/10 p-10 md:my-20 md:p-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <div className="flex justify-center md:w-1/4 md:justify-start">
            <img src={setupImg} alt="wallet" className="w-40 object-contain md:w-52" />
          </div>
          <div className="grid w-full grid-cols-2 gap-4 md:w-3/4 md:grid-cols-4">
            <div className="text-center">
              <div className="bg-gradient-to-r from-[#fff4bf] to-[#b77912] bg-clip-text text-4xl font-bold text-transparent"><CountUp target={75} suffix="%" /></div>
              <div className="text-sm text-slate-300">市场奖励总拨出</div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-[#fff4bf] to-[#b77912] bg-clip-text text-4xl font-bold text-transparent"><CountUp target={40} suffix="%" /></div>
              <div className="text-sm text-slate-300">直推奖励占比</div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-[#fff4bf] to-[#b77912] bg-clip-text text-4xl font-bold text-transparent"><CountUp target={35} suffix="%" /></div>
              <div className="text-sm text-slate-300">极差奖励占比</div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-[#fff4bf] to-[#b77912] bg-clip-text text-4xl font-bold text-transparent"><CountUp target={30} suffix="层" /></div>
              <div className="text-sm text-slate-300">极差计算深度</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold">核心规则示例</h2>
          <p className="mt-2 text-slate-300">围绕“购买绑定、极差分润、升级还款”三个高频流程，展示首页关键信息口径</p>
        </div>
        <div className="mx-auto">
          {[
            {
              id: 'SVIP1',
              title: '首次购买与绑定',
              summary: '首次调用购买方法时必须传入推荐人地址，合约会先校验推荐人状态，再完成绑定与扣款。',
              points: ['推荐人必须已激活', '购买与绑定在同一笔交易内完成']
            },
            {
              id: 'SVIP2',
              title: '开通后关系锁定',
              summary: '用户完成首次购买后推荐关系不可逆，后续进入购买流程时沿用原绑定关系。',
              points: ['绑定后不可修改上级', '未绑定状态下购买会被拒绝']
            },
            {
              id: 'SVIP3',
              title: '极差奖励计算',
              summary: 'VIP2 比例 15%，下级 VIP1 比例 10%，则 VIP2 从该团队可获得差值 5% 的极差奖励。',
              points: ['计算公式：奖励基数 × (15% - 10%)', '仅统计 30 层以内团队业绩']
            },
            {
              id: 'SVIP4',
              title: '升级首付规则',
              summary: 'VIP3 升级总额 3000U，首付 600U；VIP5 升级总额 10000U，首付 2000U。',
              points: ['首付后立即获得对应权限', '代理/合伙人按等级解锁权限']
            },
            {
              id: 'SVIP5',
              title: '分期自动扣款',
              summary: '用户动态奖励累计超过首付后，超出部分按 20% 扣款，直到升级订单全部还清。',
              points: ['扣款触发：动态奖励入账时', '扣款记录上链可审计']
            }
          ].map((item, index, arr) => (
            <div key={item.id}>
              <article className="glass rounded-2xl p-6 md:p-7">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-[#fff4bf] to-[#b77912] px-1 text-xs font-bold leading-none text-black md:text-sm">
                    {item.id}
                  </div>
                  <h4 className="text-lg font-semibold">{item.title}</h4>
                </div>
                <p className="mb-4 leading-7 text-slate-300">{item.summary}</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {item.points.map((point) => (
                    <div key={point} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      {point}
                    </div>
                  ))}
                </div>
              </article>
              {index < arr.length - 1 && (
                <div className="flex items-center justify-center py-4 text-[#f8d66d]">
                  <AppIcon icon="mdi:arrow-down-thin" className="text-5xl" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="pb-28 pt-20 text-center md:pb-32 md:pt-24">
        <div className="glass mx-auto max-w-4xl rounded-3xl p-8 md:p-12">
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">准备开通机器人跟单权限？</h2>
          <p className="mb-6 text-slate-300">首页文案已对齐改版开发文档，覆盖入口、购买绑定、等级分润、升级还款与代理码池核心流程</p>
          <div className="footer__subscribe"></div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fcd535] to-[#b77912]  px-5 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-[position:100%_0]"
            >
              去用户中心开通
              <AppIcon icon="mdi:rocket-launch-outline" />
            </Link>
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white">
              进入用户中心
              <AppIcon icon="mdi:wallet-outline" />
            </Link>
          </div>


        </div>
      </section>
    </>
  );
}
