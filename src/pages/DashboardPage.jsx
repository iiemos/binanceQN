import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppIcon from '../components/AppIcon';
import { mockPurchaseAndBind, mockUpgradeLevel } from '../services/api/purchase';
import {
  bindBinanceUid,
  fetchCommissionList,
  fetchMyCode,
  fetchUpgradeOrder,
  fetchUserInfo,
  fetchUserTree
} from '../services/api/user';
import {
  deleteAgentCode,
  fetchAgentCode,
  fetchAgentEarnings,
  fetchAgentTeam,
  fetchAgentWithdrawHistory,
  setAgentCode,
  withdrawAgentEarnings
} from '../services/api/agent';
import { shortAddress } from '../utils/address';

const levelRankMap = {
  普通用户: 0,
  有效用户: 1,
  VIP1: 2,
  VIP2: 3,
  VIP3: 4,
  VIP4: 5,
  VIP5: 6
};

function getLevelRank(level) {
  return levelRankMap[level] ?? 0;
}

function summarizeTeam(root) {
  if (!root) {
    return {
      totalMembers: 0,
      maxDepth: 0,
      levelStats: { vip1: 0, vip2: 0, vip3: 0, vip4: 0, vip5: 0, active: 0 }
    };
  }

  const levelStats = { vip1: 0, vip2: 0, vip3: 0, vip4: 0, vip5: 0, active: 0 };
  const queue = (root.children || []).map((node) => ({ node, depth: 1 }));
  let totalMembers = 0;
  let maxDepth = 0;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    totalMembers += 1;
    maxDepth = Math.max(maxDepth, current.depth);

    const level = current.node.level;
    if (level === 'VIP1') levelStats.vip1 += 1;
    if (level === 'VIP2') levelStats.vip2 += 1;
    if (level === 'VIP3') levelStats.vip3 += 1;
    if (level === 'VIP4') levelStats.vip4 += 1;
    if (level === 'VIP5') levelStats.vip5 += 1;
    if (level !== '普通用户') levelStats.active += 1;

    (current.node.children || []).forEach((child) => {
      queue.push({ node: child, depth: current.depth + 1 });
    });
  }

  return { totalMembers, maxDepth, levelStats };
}

function formatCommissionType(type) {
  if (type === 'direct') return '直推';
  if (type === 'spread') return '极差';
  if (type === 'agent') return '代理';
  return type || '-';
}

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [userInfo, setUserInfo] = useState(null);
  const [myCode, setMyCode] = useState(null);
  const [upgradeOrder, setUpgradeOrder] = useState(null);
  const [tree, setTree] = useState(null);

  const [rewards, setRewards] = useState([]);
  const [commissionType, setCommissionType] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [uidInput, setUidInput] = useState('');
  const [uidSaving, setUidSaving] = useState(false);
  const [uidError, setUidError] = useState('');
  const [uidMessage, setUidMessage] = useState('');

  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const [agentCodeInput, setAgentCodeInput] = useState('');
  const [agentCodeSaving, setAgentCodeSaving] = useState(false);
  const [agentCodeMessage, setAgentCodeMessage] = useState('');
  const [agentCodeError, setAgentCodeError] = useState('');

  const [agentEarnings, setAgentEarnings] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [agentWithdrawHistory, setAgentWithdrawHistory] = useState([]);
  const [agentTeam, setAgentTeam] = useState(null);

  const [inviterAddress, setInviterAddress] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseResult, setPurchaseResult] = useState(null);

  const walletAddress = useMemo(() => localStorage.getItem('wallet_address') || '', []);
  const hasConnectedWallet = Boolean(walletAddress);

  const inviteLink = useMemo(() => {
    if (!walletAddress) return '';
    return `${window.location.origin}/dashboard?ref=${walletAddress}`;
  }, [walletAddress]);

  const teamSummary = useMemo(() => summarizeTeam(tree), [tree]);
  const directMembers = useMemo(() => tree?.children || [], [tree]);
  const levelRank = useMemo(() => getLevelRank(userInfo?.level), [userInfo?.level]);
  const canUpgradeVip3 = userInfo?.level === 'VIP2';
  const canUpgradeVip5 = userInfo?.level === 'VIP4';
  const isAgentRole = Boolean(userInfo?.isAgent || userInfo?.isPartner);
  const freeUpgradeReady = levelRank < 2 && Number(userInfo?.directCount || 0) >= 5;
  const shouldShowUpgradeCenter = Boolean(
    freeUpgradeReady || canUpgradeVip3 || canUpgradeVip5 || (upgradeOrder?.status && upgradeOrder.status !== 'none')
  );
  const shouldShowUidCard = !userInfo?.uid;

  const metrics = useMemo(
    () => [
      { label: '直推人数', value: userInfo?.directCount || 0 },
      { label: '团队总人数', value: teamSummary.totalMembers },
      { label: '累计收益(U)', value: Number(userInfo?.totalEarnings || 0).toFixed(2) },
      { label: '待还金额(U)', value: Number(userInfo?.debtRemaining || 0).toFixed(2) }
    ],
    [teamSummary.totalMembers, userInfo]
  );

  const rewardSummary = useMemo(() => {
    return rewards.reduce(
      (acc, item) => {
        const amount = Number(item.amount || 0);
        if (item.type === 'direct') acc.direct += amount;
        if (item.type === 'spread') acc.spread += amount;
        if (item.type === 'agent') acc.agent += amount;
        return acc;
      },
      { direct: 0, spread: 0, agent: 0 }
    );
  }, [rewards]);

  const loadAgentModules = async () => {
    const [codeResp, earningsResp, historyResp, teamResp] = await Promise.all([
      fetchAgentCode(),
      fetchAgentEarnings(),
      fetchAgentWithdrawHistory({ page: 1, limit: 10 }),
      fetchAgentTeam()
    ]);

    const nextAgentCode = codeResp.data?.code || '';
    setAgentCodeInput(nextAgentCode);
    setAgentEarnings(Number(earningsResp.data?.available || 0));
    setAgentWithdrawHistory(historyResp.data?.list || []);
    setAgentTeam(teamResp.data || null);
  };

  const loadDashboardData = async () => {
    if (!hasConnectedWallet) return;

    setLoading(true);
    setError('');
    try {
      const [userResp, codeResp, orderResp, treeResp, commissionResp] = await Promise.all([
        fetchUserInfo(),
        fetchMyCode(),
        fetchUpgradeOrder(),
        fetchUserTree(3),
        fetchCommissionList({ type: commissionType, page, limit })
      ]);

      const info = userResp.data || null;
      setUserInfo(info);
      setMyCode(codeResp.data || null);
      setUpgradeOrder(orderResp.data || null);
      setTree(treeResp.data || null);
      setRewards(commissionResp.data?.list || []);
      setTotal(commissionResp.data?.total || 0);

      if (info?.uid) {
        setUidInput(info.uid);
      }

      if (info?.isAgent || info?.isPartner) {
        await loadAgentModules();
      } else {
        setAgentCodeInput('');
        setAgentEarnings(0);
        setAgentWithdrawHistory([]);
        setAgentTeam(null);
      }
    } catch (requestError) {
      const message = requestError?.response?.data?.message || requestError?.message || '加载用户中心失败';
      setError(Array.isArray(message) ? message.join('；') : message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, [hasConnectedWallet, commissionType, page, limit]);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setInviterAddress(ref.trim());
    }
  }, [searchParams]);

  const handleCopyText = async (text, setter) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      window.setTimeout(() => setter(false), 1200);
    } catch {
      setter(false);
    }
  };

  const handleBindUid = async () => {
    setUidError('');
    setUidMessage('');

    if (!uidInput.trim()) {
      setUidError('请输入币安 UID');
      return;
    }

    setUidSaving(true);
    try {
      await bindBinanceUid(uidInput.trim());
      setUidMessage('UID 绑定成功');
      await loadDashboardData();
    } catch (requestError) {
      const message = requestError?.response?.data?.message || requestError?.message || 'UID 绑定失败';
      setUidError(Array.isArray(message) ? message.join('；') : message);
    } finally {
      setUidSaving(false);
    }
  };

  const handleUpgrade = async (targetLevel) => {
    setUpgradeError('');
    setUpgradeMessage('');
    setUpgradeLoading(true);
    try {
      await mockUpgradeLevel({
        userAddress: walletAddress,
        targetLevel
      });
      setUpgradeMessage(targetLevel === 'vip3' ? 'VIP3 升级提交成功' : 'VIP5 升级提交成功');
      await loadDashboardData();
    } catch (requestError) {
      const message = requestError?.response?.data?.message || requestError?.message || '升级失败';
      setUpgradeError(Array.isArray(message) ? message.join('；') : message);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchaseError('');

    if (!hasConnectedWallet) {
      setPurchaseError('请先连接钱包，再进行开通。');
      return;
    }

    const normalizedInviter = inviterAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedInviter)) {
      setPurchaseError('推荐人地址格式不正确，请输入 0x 开头 40 位地址。');
      return;
    }

    setPurchaseLoading(true);
    try {
      const response = await mockPurchaseAndBind({
        userAddress: walletAddress,
        inviterAddress: normalizedInviter,
        amount: 100
      });
      setPurchaseResult(response.data || null);
      await loadDashboardData();
    } catch (requestError) {
      const message = requestError?.response?.data?.message || requestError?.message || '开通失败，请稍后重试';
      setPurchaseError(Array.isArray(message) ? message.join('；') : message);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleSaveAgentCode = async () => {
    setAgentCodeError('');
    setAgentCodeMessage('');

    if (!agentCodeInput.trim()) {
      setAgentCodeError('请输入跟单码');
      return;
    }

    setAgentCodeSaving(true);
    try {
      await setAgentCode(agentCodeInput.trim());
      setAgentCodeMessage('专属跟单码已保存');
      await loadAgentModules();
      await loadDashboardData();
    } catch (requestError) {
      const message = requestError?.response?.data?.message || requestError?.message || '保存失败';
      setAgentCodeError(Array.isArray(message) ? message.join('；') : message);
    } finally {
      setAgentCodeSaving(false);
    }
  };

  const handleDeleteAgentCode = async () => {
    setAgentCodeError('');
    setAgentCodeMessage('');
    setAgentCodeSaving(true);
    try {
      await deleteAgentCode();
      setAgentCodeInput('');
      setAgentCodeMessage('专属跟单码已删除');
      await loadAgentModules();
      await loadDashboardData();
    } catch (requestError) {
      const message = requestError?.response?.data?.message || requestError?.message || '删除失败';
      setAgentCodeError(Array.isArray(message) ? message.join('；') : message);
    } finally {
      setAgentCodeSaving(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawError('');
    setWithdrawMessage('');

    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawError('请输入有效提取金额');
      return;
    }

    setWithdrawing(true);
    try {
      const response = await withdrawAgentEarnings(amount);
      setWithdrawAmount('');
      setWithdrawMessage(`提取成功，交易哈希：${response.data?.txHash || '-'}`);
      await loadAgentModules();
      await loadDashboardData();
    } catch (requestError) {
      const message = requestError?.response?.data?.message || requestError?.message || '提取失败';
      setWithdrawError(Array.isArray(message) ? message.join('；') : message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (!hasConnectedWallet) {
    return (
      <div className="quant-page">
        <section className="glass rounded-2xl p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs text-primary">
            <AppIcon icon="mdi:wallet-outline" />
            请先连接钱包
          </div>
          <p className="mt-4 text-sm text-slate-300">连接后即可在当前用户中心完成开通、查看团队状态与收益信息。</p>
        </section>
      </div>
    );
  }

  return (
    <div className="quant-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-300">
            <AppIcon icon="solar:crown-minimalistic-bold-duotone" className="size-3" />
            {userInfo?.level || '普通用户'}
          </div>
          {userInfo?.isAgent ? (
            <div className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              <AppIcon icon="solar:shield-star-bold-duotone" className="size-3" />
              官方代理
            </div>
          ) : null}
          {userInfo?.isPartner ? (
            <div className="inline-flex items-center gap-1.5 rounded border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400">
              <AppIcon icon="solar:medal-star-bold-duotone" className="size-3" />
              精英合伙人
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dashboard-backup"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:text-white"
          >
            <AppIcon icon="solar:widget-3-bold-duotone" className="size-3" />
            主看板
          </Link>
          <button
            type="button"
            onClick={() => void loadDashboardData()}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:text-white"
          >
            <AppIcon icon="solar:refresh-linear" className={`size-3 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            推荐人地址
          </p>
          <div className="flex items-center gap-2">
            <AppIcon icon="solar:users-group-rounded-bold" className="text-primary" />
            <span className="text-xs font-mono text-white break-all">{userInfo?.inviter || '-'}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            币安 UID
          </p>
          <div className="flex items-center gap-2">
            <AppIcon icon="solar:user-id-bold" className="text-primary" />
            <span className="text-xs font-mono text-white">{userInfo?.uid || '-'}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[8px] font-bold uppercase tracking-tighter">
              {userInfo?.uid ? '已绑定' : '待绑定'}
            </span>
          </div>
        </div>
      </div>

      {error ? (
        <section className="mb-6 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </section>
      ) : null}

      {!userInfo?.isValidUser ? (
        <>
          <section className="glass rounded-2xl p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f0b90b]/30 bg-[#f0b90b]/10 px-4 py-1 text-xs text-[#f0b90b]">
              <AppIcon icon="mdi:alert-circle-outline" />
              当前账户尚未开通权限
            </div>
            <p className="mt-4 text-sm text-slate-300">开通流程已合并到用户中心。填写推荐人地址后，可直接在本页完成 100U 权限购买与绑定。</p>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="glass rounded-2xl p-6 xl:col-span-2">
              <h2 className="text-xl font-bold">开通流程</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">1. 填写推荐人地址，支持 `?ref=` 邀请链接自动填充</div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">2. 钱包确认交易，调用 `purchaseAndBind` 完成绑定与开通</div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">3. 交易成功后系统分配跟单码，用户中心自动刷新状态</div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">4. 后续升级、团队与收益都在同一页统一查看</div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 xl:col-span-3">
              <h2 className="text-xl font-bold">开通表单</h2>
              <p className="mt-2 text-sm text-slate-300">推荐人地址必填，且推荐人必须已激活。首次绑定后不可修改。</p>

              <div className="mt-5 space-y-3">
                <div className="quant-subcard rounded-xl border border-white/10 px-4 py-3">
                  <label className="mb-2 block text-xs text-slate-400" htmlFor="dashboardInviterAddress">
                    推荐人地址
                  </label>
                  <input
                    id="dashboardInviterAddress"
                    value={inviterAddress}
                    onChange={(event) => setInviterAddress(event.target.value)}
                    placeholder="0x..."
                    className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div className="quant-subcard rounded-xl border border-white/10 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-slate-400">钱包地址</span>
                    <span className="font-mono">{shortAddress(walletAddress, 8, 6)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-slate-400">开通费用</span>
                    <span className="font-semibold">100 U</span>
                  </div>
                </div>

                {purchaseError ? (
                  <div className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                    {purchaseError}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handlePurchase()}
                  disabled={purchaseLoading || loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f0b90b] px-5 py-3 text-sm font-semibold text-black transition-opacity hover:bg-[#f0b90b]/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <AppIcon icon="mdi:rocket-launch-outline" />
                  {purchaseLoading ? '提交中...' : '确认开通'}
                </button>
              </div>
            </div>
          </section>

          {purchaseResult ? (
            <section className="mt-6 glass rounded-2xl p-6">
              <h2 className="text-xl font-bold">交易结果</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="quant-subcard rounded-xl border border-white/10 px-4 py-3 text-sm">
                  <div className="text-xs text-slate-400">交易哈希</div>
                  <div className="mt-1 break-all font-mono">{purchaseResult.txHash || '-'}</div>
                </div>
                <div className="quant-subcard rounded-xl border border-white/10 px-4 py-3 text-sm">
                  <div className="text-xs text-slate-400">分配跟单码</div>
                  <div className="mt-1">{purchaseResult.assignedCode?.code || '-'}</div>
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {userInfo?.isValidUser ? (
        <>
          {purchaseResult ? (
            <section className="mb-6 glass rounded-2xl p-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
                <AppIcon icon="mdi:check-circle-outline" />
                开通成功
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="quant-subcard rounded-xl border border-white/10 px-4 py-3 text-sm">
                  <div className="text-xs text-slate-400">交易哈希</div>
                  <div className="mt-1 break-all font-mono">{purchaseResult.txHash || '-'}</div>
                </div>
                <div className="quant-subcard rounded-xl border border-white/10 px-4 py-3 text-sm">
                  <div className="text-xs text-slate-400">分配跟单码</div>
                  <div className="mt-1">{purchaseResult.assignedCode?.code || myCode?.code || '-'}</div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((item) => (
              <div key={item.label} className="glass rounded-2xl p-5">
                <div className="text-xs text-slate-400">{item.label}</div>
                <div className="mt-2 text-4xl font-black text-primary">{item.value}</div>
              </div>
            ))}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="glass rounded-2xl p-6 xl:col-span-1">
              <div>
                <h2 className="text-xl font-bold">我的跟单码</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  分享你的专属跟单码，系统会按网络行为和绑定关系结算对应奖励。
                </p>
              </div>
              <div className="mt-6 rounded-md border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <code className="min-w-0 truncate font-mono text-lg font-black tracking-[0.18em] text-[#f0b90b]">
                    {myCode?.code || '-'}
                  </code>
                  {myCode?.code ? (
                    <button
                      type="button"
                      onClick={() => void handleCopyText(myCode.code, setCopiedCode)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#f0b90b]/20 bg-[#f0b90b]/10 text-[#f0b90b] transition-colors hover:bg-[#f0b90b]/15"
                      title={copiedCode ? '已复制' : '复制跟单码'}
                    >
                      <AppIcon icon={copiedCode ? 'solar:check-read-linear' : 'solar:copy-linear'} className="text-base" />
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  来源：
                  {myCode?.source === 'agent'
                    ? '代理专属码'
                    : myCode?.source === 'pool'
                      ? '系统码池'
                      : '-'}
                  {' · '}状态：{myCode?.status || 'none'}
                </div>
              </div>
            </div>

            <div className={`glass rounded-2xl p-6 ${shouldShowUidCard || shouldShowUpgradeCenter ? 'xl:col-span-1' : 'xl:col-span-2'}`}>
              <div>
                <h2 className="text-xl font-bold">我的邀请链接</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  将这个链接分发给新用户，系统会自动把新成员绑定到你的节点下，返佣按规则实时结算。
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-md border border-white/10 bg-black/25 p-4">
                  <AppIcon icon="solar:link-bold" className="shrink-0 text-sm text-slate-500" />
                  <span className="truncate text-sm text-slate-300">{inviteLink || '-'}</span>
                </div>
                <div className="shrink-0">
                  {inviteLink ? (
                    <button
                      type="button"
                      onClick={() => void handleCopyText(inviteLink, setCopiedInvite)}
                      className="inline-flex items-center justify-center rounded-md bg-[#f0b90b] px-5 py-4 text-sm font-extrabold tracking-wide text-black transition-colors hover:bg-[#f0b90b]/90"
                      title={copiedInvite ? '已复制' : '复制邀请链接'}
                    >
                      {copiedInvite ? '已复制' : '复制链接'}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {shouldShowUpgradeCenter ? (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold">升级中心</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">订单状态</span>
                    <span>{upgradeOrder?.status || 'none'}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>已还 / 总额</span>
                    <span>{upgradeOrder?.paid || 0} / {upgradeOrder?.total || 0} U</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                    <span>待还金额</span>
                    <span>{upgradeOrder?.remaining || 0} U</span>
                  </div>

                  {freeUpgradeReady ? (
                    <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-300">
                      你已满足 VIP1 直推人数条件，晋升由系统引擎计算后生效。
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {canUpgradeVip3 ? (
                      <button
                        type="button"
                        onClick={() => void handleUpgrade('vip3')}
                        disabled={upgradeLoading || loading}
                        className="rounded-full bg-[#f0b90b] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f0b90b]/90 disabled:opacity-60"
                      >
                        {upgradeLoading ? '处理中...' : '升级 VIP3（首付 600U）'}
                      </button>
                    ) : null}
                    {canUpgradeVip5 ? (
                      <button
                        type="button"
                        onClick={() => void handleUpgrade('vip5')}
                        disabled={upgradeLoading || loading}
                        className="rounded-full bg-[#f0b90b] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f0b90b]/90 disabled:opacity-60"
                      >
                        {upgradeLoading ? '处理中...' : '升级 VIP5（首付 2000U）'}
                      </button>
                    ) : null}
                  </div>

                  {upgradeError ? <div className="text-xs text-rose-300">{upgradeError}</div> : null}
                  {upgradeMessage ? <div className="text-xs text-emerald-300">{upgradeMessage}</div> : null}
                </div>
              </div>
            ) : null}

            {shouldShowUidCard ? (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold">币安 UID</h2>
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <input
                      value={uidInput}
                      onChange={(event) => setUidInput(event.target.value)}
                      placeholder="输入币安 UID"
                      className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void handleBindUid()}
                      disabled={uidSaving}
                      className="w-full rounded-full bg-[#f0b90b] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f0b90b]/90 disabled:opacity-60"
                    >
                      {uidSaving ? '提交中...' : '绑定 UID'}
                    </button>
                  </div>
                  {uidError ? <div className="mt-2 text-xs text-rose-300">{uidError}</div> : null}
                  {uidMessage ? <div className="mt-2 text-xs text-emerald-300">{uidMessage}</div> : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="glass rounded-2xl p-6 xl:col-span-1">
              <h2 className="text-xl font-bold">团队结构摘要</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between border-b border-white/10 pb-2"><span className="text-slate-400">团队总人数</span><span>{teamSummary.totalMembers}</span></div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2"><span className="text-slate-400">最大深度</span><span>{teamSummary.maxDepth}</span></div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2"><span className="text-slate-400">有效用户</span><span>{teamSummary.levelStats.active}</span></div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2"><span className="text-slate-400">VIP1</span><span>{teamSummary.levelStats.vip1}</span></div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2"><span className="text-slate-400">VIP2</span><span>{teamSummary.levelStats.vip2}</span></div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2"><span className="text-slate-400">VIP3</span><span>{teamSummary.levelStats.vip3}</span></div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2"><span className="text-slate-400">VIP4</span><span>{teamSummary.levelStats.vip4}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">VIP5</span><span>{teamSummary.levelStats.vip5}</span></div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">直推成员</h2>
                <span className="text-sm text-slate-400">{directMembers.length} 人</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-300">
                    <tr>
                      <th className="px-3 py-3 font-semibold">地址</th>
                      <th className="px-3 py-3 font-semibold">等级</th>
                      <th className="px-3 py-3 font-semibold">下级数量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directMembers.length > 0 ? directMembers.map((member) => (
                      <tr key={member.address} className="border-t border-white/10">
                        <td className="px-3 py-3 font-mono">{shortAddress(member.address, 8, 6)}</td>
                        <td className="px-3 py-3">{member.level || '-'}</td>
                        <td className="px-3 py-3">{member.children?.length || 0}</td>
                      </tr>
                    )) : (
                      <tr className="border-t border-white/10">
                        <td className="px-3 py-8 text-center text-slate-400" colSpan={3}>暂无直推成员</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mt-6 glass rounded-2xl p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">收益明细</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <select
                  value={commissionType}
                  onChange={(event) => {
                    setCommissionType(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2"
                >
                  <option value="all">全部类型</option>
                  <option value="direct">直推</option>
                  <option value="spread">极差</option>
                  <option value="agent">代理</option>
                </select>
                <select
                  value={limit}
                  onChange={(event) => {
                    setLimit(Number(event.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2"
                >
                  <option value={10}>10/页</option>
                  <option value={20}>20/页</option>
                  <option value={50}>50/页</option>
                </select>
                <span className="text-slate-400">共 {total} 条</span>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="quant-subcard rounded-xl border border-white/10 px-4 py-3 text-sm">直推：{rewardSummary.direct.toFixed(2)} U</div>
              <div className="quant-subcard rounded-xl border border-white/10 px-4 py-3 text-sm">极差：{rewardSummary.spread.toFixed(2)} U</div>
              <div className="quant-subcard rounded-xl border border-white/10 px-4 py-3 text-sm">代理：{rewardSummary.agent.toFixed(2)} U</div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold">时间</th>
                    <th className="px-4 py-3 font-semibold">类型</th>
                    <th className="px-4 py-3 font-semibold">金额(U)</th>
                    <th className="px-4 py-3 font-semibold">来源地址</th>
                    <th className="px-4 py-3 font-semibold">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.length > 0 ? rewards.map((item) => (
                    <tr key={item.id} className="border-t border-white/10">
                      <td className="px-4 py-3">{item.time?.replace('T', ' ').slice(0, 19)}</td>
                      <td className="px-4 py-3">{formatCommissionType(item.type)}</td>
                      <td className="px-4 py-3">{item.amount}</td>
                      <td className="px-4 py-3 font-mono">{shortAddress(item.from, 8, 6)}</td>
                      <td className="px-4 py-3">{item.note || '-'}</td>
                    </tr>
                  )) : (
                    <tr className="border-t border-white/10">
                      <td className="px-4 py-8 text-center text-slate-400" colSpan={5}>暂无收益记录</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2 text-sm">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 disabled:opacity-40"
              >
                上一页
              </button>
              <span className="text-slate-400">第 {page} 页</span>
              <button
                type="button"
                disabled={page * limit >= total || loading}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          </section>

          {isAgentRole ? (
            <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold">代理码配置</h2>
                <p className="mt-2 text-sm text-slate-300">配置后下级用户将优先领取你的专属跟单码。</p>
                <div className="mt-4 space-y-3">
                  <input
                    value={agentCodeInput}
                    onChange={(event) => setAgentCodeInput(event.target.value)}
                    placeholder="输入专属跟单码"
                    className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveAgentCode()}
                      disabled={agentCodeSaving}
                      className="rounded-full bg-[#f0b90b] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f0b90b]/90 disabled:opacity-60"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteAgentCode()}
                      disabled={agentCodeSaving}
                      className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm disabled:opacity-60"
                    >
                      删除
                    </button>
                  </div>
                  {agentCodeError ? <div className="text-xs text-rose-300">{agentCodeError}</div> : null}
                  {agentCodeMessage ? <div className="text-xs text-emerald-300">{agentCodeMessage}</div> : null}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold">代单收益提取</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="quant-subcard rounded-xl border border-white/10 px-4 py-3">
                    可提取额度：<span className="font-semibold text-primary">{agentEarnings.toFixed(2)} U</span>
                  </div>
                  <input
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    placeholder="输入提取金额"
                    className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleWithdraw()}
                    disabled={withdrawing}
                    className="rounded-full bg-[#f0b90b] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f0b90b]/90 disabled:opacity-60"
                  >
                    {withdrawing ? '处理中...' : '提交提取'}
                  </button>
                  {withdrawError ? <div className="text-xs text-rose-300">{withdrawError}</div> : null}
                  {withdrawMessage ? <div className="text-xs text-emerald-300">{withdrawMessage}</div> : null}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold">代理团队统计</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2"><span className="text-slate-400">团队总业绩</span><span>{agentTeam?.totalVolume || 0}</span></div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2"><span className="text-slate-400">最大深度</span><span>{agentTeam?.maxDepth || 0}</span></div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2"><span className="text-slate-400">有效人数</span><span>{agentTeam?.memberCounts?.active || 0}</span></div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2"><span className="text-slate-400">直推奖励</span><span>{agentTeam?.rewardSummary?.direct || 0}</span></div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2"><span className="text-slate-400">极差奖励</span><span>{agentTeam?.rewardSummary?.spread || 0}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-400">代理奖励</span><span>{agentTeam?.rewardSummary?.agent || 0}</span></div>
                </div>
              </div>

            </section>
          ) : null}

          <section className="mt-6 glass rounded-2xl p-6">
            <h2 className="text-xl font-bold">联系客服</h2>
            <div className="mt-3 space-y-1 text-sm text-slate-300">
              <p>1. Telegram：@genesis_quant_support</p>
              <p>2. 邮箱：support@genesis-ai-quant.example</p>
              <p>3. 反馈问题请附钱包地址与交易哈希</p>
            </div>
          </section>
        </>
      ) : null}

      {loading ? <p className="mt-4 text-sm text-slate-400">数据加载中...</p> : null}
    </div>
  );
}
