import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { loginByWallet } from '../services/api/auth';
import { mockUpgradeLevel } from '../services/api/purchase';
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
      activeMembers: 0,
      levelStats: { vip1: 0, vip2: 0, vip3: 0, vip4: 0, vip5: 0 }
    };
  }

  const levelStats = { vip1: 0, vip2: 0, vip3: 0, vip4: 0, vip5: 0 };
  const queue = (root.children || []).map((node) => ({ node, depth: 1 }));
  let totalMembers = 0;
  let maxDepth = 0;
  let activeMembers = 0;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    totalMembers += 1;
    maxDepth = Math.max(maxDepth, current.depth);

    const level = current.node.level;
    if (level !== '普通用户') activeMembers += 1;
    if (level === 'VIP1') levelStats.vip1 += 1;
    if (level === 'VIP2') levelStats.vip2 += 1;
    if (level === 'VIP3') levelStats.vip3 += 1;
    if (level === 'VIP4') levelStats.vip4 += 1;
    if (level === 'VIP5') levelStats.vip5 += 1;

    (current.node.children || []).forEach((child) => {
      queue.push({ node: child, depth: current.depth + 1 });
    });
  }

  return { totalMembers, maxDepth, activeMembers, levelStats };
}

function formatCommissionType(type) {
  if (type === 'direct') return '直推佣金';
  if (type === 'spread') return '极差分润';
  if (type === 'agent') return '代理覆盖收益';
  return type || '-';
}

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 19);
}

function formatAmount(value, digits = 2) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '-';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function getCodeSourceLabel(source) {
  if (source === 'agent') return '代理专属码';
  if (source === 'pool') return '系统码池';
  return '待分配';
}

function getCodeStatusLabel(status) {
  if (status === 'used') return '已使用';
  if (status === 'assigned') return '已分配';
  return '未分配';
}

function getUpgradeStatusLabel(status) {
  if (status === 'repaying') return '分期还款中';
  if (status === 'completed') return '已结清';
  return '未创建';
}

function TeamBranch({ nodes, depth = 1 }) {
  if (!nodes.length) return null;

  return (
    <div className={`${depth > 1 ? 'ml-8 border-l border-border pl-6' : ''} space-y-3 relative`}>
      {nodes.map((node, index) => (
        <div key={`${node.address}-${depth}`} className="space-y-3">
          <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-2 rounded relative before:absolute before:w-6 before:h-[1px] before:bg-border before:-left-6 before:top-1/2">
            <div className="size-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-mono">
              {depth === 1 ? `U${index + 1}` : depth}
            </div>
            <div className="flex-1 flex items-center justify-between gap-3">
              <span className="text-[11px] font-mono">{shortAddress(node.address, 6, 4)}</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded whitespace-nowrap">
                {node.level || '-'}
              </span>
            </div>
            <Icon icon="solar:alt-arrow-right-linear" className="size-3 text-muted-foreground" />
          </div>
          {node.children?.length ? <TeamBranch nodes={node.children} depth={depth + 1} /> : null}
        </div>
      ))}
    </div>
  );
}

export default function BackupDashboardPage() {
  const [walletAddress, setWalletAddress] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('wallet_address') || '';
  });
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

  const hasConnectedWallet = Boolean(walletAddress);
  const walletLabel = walletAddress ? shortAddress(walletAddress, 4, 4) : '未连接钱包';
  const inviteLink = useMemo(() => {
    if (!walletAddress || typeof window === 'undefined') return '';
    return `${window.location.origin}/dashboard?ref=${walletAddress}`;
  }, [walletAddress]);
  const levelRank = useMemo(() => getLevelRank(userInfo?.level), [userInfo?.level]);
  const teamSummary = useMemo(() => summarizeTeam(tree), [tree]);
  const directMembers = useMemo(() => tree?.children || [], [tree]);
  const teamVolume = useMemo(() => teamSummary.activeMembers * 100, [teamSummary.activeMembers]);
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
  const isAgentRole = Boolean(userInfo?.isAgent || userInfo?.isPartner);
  const canShowVip3Upgrade = Boolean(userInfo?.isValidUser) && levelRank < 4;
  const canShowVip5Upgrade = Boolean(userInfo?.isValidUser) && levelRank < 6;
  const freeUpgradeReady = Boolean(userInfo?.isValidUser) && levelRank < 2 && Number(userInfo?.directCount || 0) >= 5;

  const metrics = useMemo(
    () => [
      { label: '直推人数', value: Number(userInfo?.directCount || 0), digits: 0 },
      { label: '团队业绩', value: teamVolume, digits: 2, suffix: 'USDT' },
      { label: '累计收益', value: Number(userInfo?.totalEarnings || 0), digits: 2, suffix: 'USDT', primary: true },
      { label: '待还金额', value: Number(userInfo?.debtRemaining || 0), digits: 2, suffix: 'USDT' }
    ],
    [teamVolume, userInfo]
  );

  const loadAgentModules = async () => {
    const [codeResp, earningsResp, historyResp, teamResp] = await Promise.all([
      fetchAgentCode(),
      fetchAgentEarnings(),
      fetchAgentWithdrawHistory({ page: 1, limit: 10 }),
      fetchAgentTeam()
    ]);

    setAgentCodeInput(codeResp.data?.code || '');
    setAgentEarnings(Number(earningsResp.data?.available || 0));
    setAgentWithdrawHistory(historyResp.data?.list || []);
    setAgentTeam(teamResp.data || null);
  };

  const resetDashboardState = () => {
    setUserInfo(null);
    setMyCode(null);
    setUpgradeOrder(null);
    setTree(null);
    setRewards([]);
    setTotal(0);
    setUidInput('');
    setUidError('');
    setUidMessage('');
    setUpgradeError('');
    setUpgradeMessage('');
    setAgentCodeInput('');
    setAgentCodeError('');
    setAgentCodeMessage('');
    setAgentEarnings(0);
    setWithdrawAmount('');
    setWithdrawError('');
    setWithdrawMessage('');
    setAgentWithdrawHistory([]);
    setAgentTeam(null);
  };

  const loadDashboardData = async (activeWalletAddress = walletAddress) => {
    if (!activeWalletAddress) {
      resetDashboardState();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [userResp, codeResp, orderResp, treeResp, commissionResp] = await Promise.all([
        fetchUserInfo(),
        fetchMyCode(),
        fetchUpgradeOrder(),
        fetchUserTree(2),
        fetchCommissionList({ type: commissionType, page, limit })
      ]);

      const info = userResp.data || null;
      if (typeof window !== 'undefined') {
        const nextRole = info?.isPartner ? 'partner' : info?.isAgent ? 'agent' : 'user';
        window.localStorage.setItem('user_role', nextRole);
      }
      setUserInfo(info);
      setMyCode(codeResp.data || null);
      setUpgradeOrder(orderResp.data || null);
      setTree(treeResp.data || null);
      setRewards(commissionResp.data?.list || []);
      setTotal(commissionResp.data?.total || 0);
      setUidInput(info?.uid || '');

      if (info?.isAgent || info?.isPartner) {
        await loadAgentModules();
      } else {
        setAgentCodeInput('');
        setAgentEarnings(0);
        setAgentWithdrawHistory([]);
        setAgentTeam(null);
      }
    } catch (requestError) {
      const message = requestError?.response?.data?.message || requestError?.message || '备用看板加载失败';
      setError(Array.isArray(message) ? message.join('；') : message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncWalletAddress = () => {
      setWalletAddress(window.localStorage.getItem('wallet_address') || '');
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === 'wallet_address') {
        syncWalletAddress();
      }
    };

    const handleAccountsChanged = (accounts) => {
      const address = Array.isArray(accounts) ? accounts[0] || '' : '';
      if (address) {
        window.localStorage.setItem('wallet_address', address);
      } else {
        window.localStorage.removeItem('wallet_address');
      }
      syncWalletAddress();
    };

    syncWalletAddress();
    window.addEventListener('storage', handleStorage);
    window.ethereum?.on?.('accountsChanged', handleAccountsChanged);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }, []);

  useEffect(() => {
    void loadDashboardData(walletAddress);
  }, [walletAddress, commissionType, page, limit]);

  const handleConnectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum?.request) {
      window.alert('未检测到钱包插件，请先安装 MetaMask 或使用钱包浏览器。');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = Array.isArray(accounts) ? accounts[0] || '' : '';

      if (!address) return;

      window.localStorage.setItem('wallet_address', address);
      setWalletAddress(address);

      const response = await loginByWallet(address, 'wallet-connect-signature');
      const data = response?.data || {};

      if (data.token) {
        window.localStorage.setItem('user_token', data.token);
      }
      if (data.role) {
        window.localStorage.setItem('user_role', data.role);
      }

      await loadDashboardData(address);
    } catch {
      // ignore rejection
    }
  };

  const handleClearSession = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('wallet_address');
    window.localStorage.removeItem('user_token');
    window.localStorage.removeItem('user_role');
    setWalletAddress('');
    resetDashboardState();
  };

  const handleCopyText = async (text, setter) => {
    if (!text || !navigator?.clipboard?.writeText) return;

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
    const targetLabel = targetLevel === 'vip3' ? 'VIP3' : 'VIP5';
    const fee = targetLevel === 'vip3' ? 600 : 2000;

    if (!window.confirm(`确认发起 ${targetLabel} 升级？当前首付 ${fee} USDT。`)) {
      return;
    }

    setUpgradeError('');
    setUpgradeMessage('');
    setUpgradeLoading(true);

    try {
      await mockUpgradeLevel({
        userAddress: walletAddress,
        targetLevel
      });
      setUpgradeMessage(`${targetLabel} 升级提交成功`);
      await loadDashboardData();
    } catch (requestError) {
      const message = requestError?.response?.data?.message || requestError?.message || '升级失败';
      setUpgradeError(Array.isArray(message) ? message.join('；') : message);
    } finally {
      setUpgradeLoading(false);
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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 antialiased pb-24">
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Icon icon="solar:programming-bold-duotone" className="text-primary size-5" />
            </div>
            <span className="font-heading font-semibold tracking-tight text-lg text-foreground">
              运营作战终端
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-4 mr-4">
              <a
                href="https://www.binance.com/zh-CN/register"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Icon icon="simple-icons:binance" className="size-3" />
                币安注册链接
              </a>
              <a
                href="https://www.binance.com/zh-CN/download"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Icon icon="solar:download-minimalistic-linear" className="size-3" />
                下载应用
              </a>
            </div>

            {hasConnectedWallet ? (
              <div className="flex items-center gap-2 bg-muted/50 border border-border px-3 py-1.5 rounded-full">
                <div className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="text-xs font-mono font-medium tracking-tight">{walletLabel}</span>
                <button
                  className="hover:text-destructive transition-colors ml-1 flex items-center"
                  type="button"
                  onClick={handleClearSession}
                  title="清除本地会话"
                >
                  <Icon icon="solar:logout-linear" className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void handleConnectWallet()}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                <Icon icon="solar:wallet-bold-duotone" className="size-4" />
                连接钱包
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-teal-500/30 bg-teal-500/10 text-teal-300 text-[10px] font-bold uppercase tracking-wider">
              <Icon icon="solar:crown-minimalistic-bold-duotone" className="size-3" />
              {userInfo?.level || '普通用户'}
            </div>
            {userInfo?.isAgent ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                <Icon icon="solar:shield-star-bold-duotone" className="size-3" />
                官方代理
              </div>
            ) : null}
            {userInfo?.isPartner ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                <Icon icon="solar:medal-star-bold-duotone" className="size-3" />
                精英合伙人
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:text-white"
            >
              <Icon icon="solar:widget-3-bold-duotone" className="size-3" />
              主看板
            </Link>
            <button
              type="button"
              onClick={() => void loadDashboardData()}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:text-white"
            >
              <Icon icon="solar:refresh-linear" className={`size-3 ${loading ? 'animate-spin' : ''}`} />
              刷新数据
            </button>
          </div>
        </div>

        {error ? (
          <section className="mb-6 rounded-md border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </section>
        ) : null}

        {!hasConnectedWallet ? (
          <section className="rounded-md border border-border bg-card p-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs text-primary">
              <Icon icon="solar:wallet-bold-duotone" className="size-4" />
              请先连接钱包
            </div>
            <p className="mt-4 text-sm text-muted-foreground">连接后才会按照当前钱包身份拉取用户状态、团队数据与收益流水。</p>
            <button
              type="button"
              onClick={() => void handleConnectWallet()}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-black"
            >
              立即连接
            </button>
          </section>
        ) : null}

        {hasConnectedWallet && !userInfo?.isValidUser ? (
          <section className="rounded-md border border-border bg-card p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f0b90b]/30 bg-[#f0b90b]/10 px-4 py-1 text-xs text-[#f0b90b]">
              <Icon icon="solar:danger-triangle-bold-duotone" className="size-4" />
              当前账户尚未开通权限
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-6">
              根据开发文档，未开通权限的账户不展示仪表盘核心模块。请先完成购买绑定，系统分配跟单码后再进入备用看板。
            </p>
            <Link
              to="/dashboard"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-black"
            >
              <Icon icon="solar:rocket-2-bold-duotone" className="size-4" />
              去用户中心开通
            </Link>
          </section>
        ) : null}

        {hasConnectedWallet && userInfo?.isValidUser ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {metrics.map((item) => (
                <div key={item.label} className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md p-5">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest block mb-1">
                    {item.label}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold tabular-nums ${item.primary ? 'text-primary' : 'text-foreground'}`}>
                      {formatAmount(item.value, item.digits)}
                    </span>
                    {item.suffix ? (
                      <span className={`text-[10px] ${item.primary ? 'text-primary/80 font-bold' : 'text-muted-foreground'}`}>
                        {item.suffix}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md p-6 overflow-hidden relative">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-1">跟单部署码</h3>
                      <p className="text-xs text-muted-foreground">
                        已购买用户展示真实跟单码，可直接复制给下级绑定使用。
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-background border border-border p-1 rounded-md">
                      <code className="px-3 font-mono text-sm font-bold text-green-500">
                        {myCode?.code || '待分配'}
                      </code>
                      <button
                        className="bg-muted hover:bg-muted/80 p-1.5 rounded transition-colors text-foreground disabled:opacity-40"
                        type="button"
                        disabled={!myCode?.code}
                        onClick={() => void handleCopyText(myCode?.code || '', setCopiedCode)}
                      >
                        <Icon icon={copiedCode ? 'solar:check-read-linear' : 'solar:copy-linear'} className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span>来源：{getCodeSourceLabel(myCode?.source)}</span>
                    <span>状态：{getCodeStatusLabel(myCode?.status)}</span>
                    {userInfo?.purchasedAt ? <span>开通时间：{formatDateTime(userInfo.purchasedAt)}</span> : null}
                  </div>
                </div>

                <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Icon icon="solar:double-alt-arrow-up-bold-duotone" className="text-primary size-5" />
                      系统升级通道
                    </h3>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      当前：{userInfo?.level || '-'} / 订单：{getUpgradeStatusLabel(upgradeOrder?.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-background border border-border p-4 rounded-md">
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <span className="text-[10px] font-mono text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                          免费晋升
                        </span>
                        <span className="text-xs font-bold">目标：VIP1</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
                        {freeUpgradeReady
                          ? '当前直推有效用户数已满足 VIP1 条件，免费晋升由系统引擎按规则自动结算。'
                          : '免费晋升条件由后端晋升引擎计算，当前页面展示状态提醒，不直接触发链上调用。'}
                      </p>
                      <button
                        className="w-full border border-primary text-primary bg-primary/5 px-4 py-2 rounded text-xs font-semibold disabled:opacity-50"
                        type="button"
                        disabled
                      >
                        {freeUpgradeReady ? '已满足条件，等待系统处理' : '当前未达到免费晋升条件'}
                      </button>
                    </div>

                    <div className="bg-background border border-border p-4 rounded-md">
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">付费升级</span>
                        <span className="text-xs font-bold">
                          {canShowVip3Upgrade ? '目标：VIP3' : canShowVip5Upgrade ? '目标：VIP5' : '已达最高等级'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
                        已接入升级订单状态与首付流程。分期待还金额、已还金额和当前订单状态都来自真实接口。
                      </p>
                      <div className="space-y-2">
                        {canShowVip3Upgrade ? (
                          <button
                            className="w-full bg-primary text-black hover:bg-primary/90 px-4 py-2 rounded text-xs font-semibold transition-colors disabled:opacity-60"
                            type="button"
                            disabled={upgradeLoading || loading}
                            onClick={() => void handleUpgrade('vip3')}
                          >
                            {upgradeLoading ? '处理中...' : '支付 600 USDT 升级 VIP3'}
                          </button>
                        ) : null}
                        {canShowVip5Upgrade ? (
                          <button
                            className="w-full border border-primary/30 text-primary hover:bg-primary/10 px-4 py-2 rounded text-xs font-semibold transition-colors disabled:opacity-60"
                            type="button"
                            disabled={upgradeLoading || loading}
                            onClick={() => void handleUpgrade('vip5')}
                          >
                            {upgradeLoading ? '处理中...' : '支付 2000 USDT 升级 VIP5'}
                          </button>
                        ) : null}
                        {!canShowVip3Upgrade && !canShowVip5Upgrade ? (
                          <button
                            className="w-full border border-border text-muted-foreground px-4 py-2 rounded text-xs font-semibold"
                            type="button"
                            disabled
                          >
                            当前已无可发起的付费升级
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-background/50 border border-border rounded-md px-3 py-2">
                      订单类型：{upgradeOrder?.type || '-'}
                    </div>
                    <div className="bg-background/50 border border-border rounded-md px-3 py-2">
                      已还 / 总额：{formatAmount(upgradeOrder?.paid || 0, 2)} / {formatAmount(upgradeOrder?.total || 0, 2)} U
                    </div>
                    <div className="bg-background/50 border border-border rounded-md px-3 py-2">
                      待还：{formatAmount(upgradeOrder?.remaining || 0, 2)} U
                    </div>
                  </div>

                  {upgradeError ? <div className="mt-3 text-xs text-rose-300">{upgradeError}</div> : null}
                  {upgradeMessage ? <div className="mt-3 text-xs text-emerald-300">{upgradeMessage}</div> : null}
                </div>

                <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-6 gap-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Icon icon="solar:user-rounded-bold-duotone" className="text-primary size-5" />
                      网体结构（前两层）
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      直推 {userInfo?.directCount || 0} 人 / 团队 {teamSummary.totalMembers} 人 / 深度 {teamSummary.maxDepth}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-muted/30 p-3 border border-border rounded-md border-l border-l-primary">
                      <div className="size-8 rounded bg-background border border-border flex items-center justify-center text-xs font-bold">我</div>
                      <div className="flex-1">
                        <div className="text-xs font-bold flex items-center justify-between gap-3">
                          <span>{shortAddress(walletAddress, 6, 4)}（我）</span>
                          <span className="text-[10px] text-muted-foreground">
                            {userInfo?.directCount || 0} 直推 | {userInfo?.level || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {directMembers.length ? (
                      <div className="ml-8 border-l border-border pl-6 space-y-3 relative">
                        <TeamBranch nodes={directMembers} />
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground border border-dashed border-border rounded-md px-4 py-6 text-center">
                        当前没有可展示的直推成员。
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md p-6">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Icon icon="simple-icons:binance" className="text-[#f0b90b] size-4" />
                    币安账户绑定
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-background border border-border px-3 py-2 rounded-md">
                      <span className="text-xs text-muted-foreground">状态</span>
                      <span className={`text-xs font-bold ${userInfo?.uid ? 'text-green-500' : 'text-[#f0b90b]'}`}>
                        {userInfo?.uid ? '已绑定' : '待绑定'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-background border border-border px-3 py-2 rounded-md">
                      <span className="text-xs text-muted-foreground">UID</span>
                      <span className="text-xs font-mono font-bold">{userInfo?.uid || '-'}</span>
                    </div>

                    {!userInfo?.uid ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={uidInput}
                          onChange={(event) => setUidInput(event.target.value)}
                          placeholder="输入币安 UID"
                          className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
                        />
                        <button
                          className="w-full bg-primary text-black hover:bg-primary/90 px-4 py-2 rounded text-xs font-semibold transition-colors disabled:opacity-60"
                          type="button"
                          disabled={uidSaving}
                          onClick={() => void handleBindUid()}
                        >
                          {uidSaving ? '绑定中...' : '提交 UID'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground text-center italic">UID 已绑定，为安全起见当前页面不支持修改。</p>
                    )}

                    <div className="border-t border-border pt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">推荐人</span>
                        <span className="font-mono text-right break-all">{userInfo?.inviter ? shortAddress(userInfo.inviter, 6, 4) : '-'}</span>
                      </div>
                      <div className="bg-background border border-border rounded-md p-3">
                        <div className="text-[10px] text-muted-foreground uppercase mb-2">邀请链接</div>
                        <div className="break-all text-[11px]">{inviteLink || '-'}</div>
                        {inviteLink ? (
                          <button
                            type="button"
                            onClick={() => void handleCopyText(inviteLink, setCopiedInvite)}
                            className="mt-2 text-[10px] text-primary hover:underline"
                          >
                            {copiedInvite ? '已复制邀请链接' : '复制邀请链接'}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {uidError ? <div className="text-xs text-rose-300">{uidError}</div> : null}
                    {uidMessage ? <div className="text-xs text-emerald-300">{uidMessage}</div> : null}
                  </div>
                </div>

                {isAgentRole ? (
                  <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-tighter">代理终端 V1</h3>
                      <Icon icon="solar:settings-bold-duotone" className="text-primary size-5" />
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-2">私域跟单码</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={agentCodeInput}
                            onChange={(event) => setAgentCodeInput(event.target.value)}
                            className="flex-1 bg-background border border-border rounded px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-primary outline-none"
                          />
                          <button
                            className="bg-primary text-black hover:bg-primary/90 px-3 py-2 rounded text-[10px] font-bold transition-colors disabled:opacity-60"
                            type="button"
                            disabled={agentCodeSaving}
                            onClick={() => void handleSaveAgentCode()}
                          >
                            保存
                          </button>
                        </div>
                        <div className="mt-2">
                          <button
                            className="text-[10px] text-muted-foreground hover:text-foreground"
                            type="button"
                            disabled={agentCodeSaving}
                            onClick={() => void handleDeleteAgentCode()}
                          >
                            删除当前码
                          </button>
                        </div>
                        {agentCodeError ? <div className="mt-2 text-xs text-rose-300">{agentCodeError}</div> : null}
                        {agentCodeMessage ? <div className="mt-2 text-xs text-emerald-300">{agentCodeMessage}</div> : null}
                      </div>

                      <div className="border-t border-accent/10 pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-mono text-muted-foreground uppercase">可提收益</label>
                          <span className="text-xs font-bold text-primary">{formatAmount(agentEarnings, 2)} USDT</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(event) => setWithdrawAmount(event.target.value)}
                            placeholder="0"
                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none mb-3"
                          />
                          <button
                            className="w-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors py-2 rounded text-xs font-bold uppercase tracking-widest disabled:opacity-60"
                            type="button"
                            disabled={withdrawing}
                            onClick={() => void handleWithdraw()}
                          >
                            {withdrawing ? '处理中...' : '提现到钱包'}
                          </button>
                          <p className="text-[9px] text-muted-foreground mt-2 italic text-center leading-tight">
                            当前后端限制单次最多提取可提额度的 10%。
                          </p>
                        </div>
                        {withdrawError ? <div className="mt-2 text-xs text-rose-300">{withdrawError}</div> : null}
                        {withdrawMessage ? <div className="mt-2 text-xs text-emerald-300 break-all">{withdrawMessage}</div> : null}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="bg-background/50 p-2 rounded text-center border border-border">
                          <div className="text-[10px] text-muted-foreground uppercase">团队业绩</div>
                          <div className="text-xs font-bold text-primary">{formatAmount(agentTeam?.totalVolume || 0, 2)}</div>
                        </div>
                        <div className="bg-background/50 p-2 rounded text-center border border-border">
                          <div className="text-[10px] text-muted-foreground uppercase">活跃节点</div>
                          <div className="text-xs font-bold text-primary">{agentTeam?.memberCounts?.active || 0}</div>
                        </div>
                        <div className="bg-background/50 p-2 rounded text-center border border-border">
                          <div className="text-[10px] text-muted-foreground uppercase">直推奖励</div>
                          <div className="text-xs font-bold text-primary">{formatAmount(agentTeam?.rewardSummary?.direct || 0, 2)}</div>
                        </div>
                        <div className="bg-background/50 p-2 rounded text-center border border-border">
                          <div className="text-[10px] text-muted-foreground uppercase">最大深度</div>
                          <div className="text-xs font-bold text-primary">{agentTeam?.maxDepth || 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md overflow-hidden">
              <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold">收益分配日志</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span>直推 {formatAmount(rewardSummary.direct, 2)} U</span>
                    <span>极差 {formatAmount(rewardSummary.spread, 2)} U</span>
                    <span>代理 {formatAmount(rewardSummary.agent, 2)} U</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={commissionType}
                    onChange={(event) => {
                      setCommissionType(event.target.value);
                      setPage(1);
                    }}
                    className="bg-background border border-border text-[10px] font-mono rounded px-2 py-1 outline-none"
                  >
                    <option value="all">全部类型</option>
                    <option value="direct">直推奖励</option>
                    <option value="spread">极差奖励</option>
                    <option value="agent">代理收益</option>
                  </select>
                  <select
                    value={limit}
                    onChange={(event) => {
                      setLimit(Number(event.target.value));
                      setPage(1);
                    }}
                    className="bg-background border border-border text-[10px] font-mono rounded px-2 py-1 outline-none"
                  >
                    <option value={10}>10/页</option>
                    <option value={20}>20/页</option>
                    <option value={50}>50/页</option>
                  </select>
                  <button
                    className="bg-muted p-1.5 rounded border border-border"
                    type="button"
                    onClick={() => void loadDashboardData()}
                  >
                    <Icon icon="solar:refresh-linear" className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
                      <th className="px-6 py-3 font-medium">时间</th>
                      <th className="px-6 py-3 font-medium">类型</th>
                      <th className="px-6 py-3 font-medium text-right">金额（USDT）</th>
                      <th className="px-6 py-3 font-medium">来源地址</th>
                      <th className="px-6 py-3 font-medium text-right">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs font-mono">
                    {rewards.length > 0 ? rewards.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-muted-foreground">{formatDateTime(item.time)}</td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-2">
                            <Icon
                              icon={
                                item.type === 'direct'
                                  ? 'solar:transfer-horizontal-linear'
                                  : item.type === 'spread'
                                    ? 'solar:graph-up-linear'
                                    : 'solar:users-group-rounded-linear'
                              }
                              className={`size-4 ${item.type === 'spread' ? 'text-purple-400' : 'text-primary'}`}
                            />
                            {formatCommissionType(item.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-primary">+{formatAmount(item.amount, 2)}</td>
                        <td className="px-6 py-4">{item.from ? shortAddress(item.from, 6, 4) : '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[10px] text-green-500 font-bold px-1.5 py-0.5 rounded border border-green-500/30 bg-green-500/5">
                            已结算
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-6 py-8 text-center text-muted-foreground" colSpan={5}>
                          暂无收益记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-mono">
                  显示 {total ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, total || 0)} / 共 {total} 条日志
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="size-8 flex items-center justify-center border border-border rounded hover:bg-muted disabled:opacity-50"
                    disabled={page <= 1 || loading}
                    type="button"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  >
                    <Icon icon="solar:alt-arrow-left-linear" />
                  </button>
                  <button
                    className="size-8 flex items-center justify-center border border-border rounded hover:bg-muted disabled:opacity-50"
                    disabled={page * limit >= total || loading}
                    type="button"
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    <Icon icon="solar:alt-arrow-right-linear" />
                  </button>
                </div>
              </div>
            </div>

          </>
        ) : null}

        {loading ? <p className="mt-6 text-sm text-muted-foreground">数据加载中...</p> : null}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 py-6 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        <div>系统节点：AP-SOUTHEAST-1</div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-foreground">技术支持</a>
          <a href="#" className="hover:text-foreground">隐私政策</a>
          <a href="#" className="hover:text-foreground">审计日志</a>
        </div>
      </footer>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon icon="solar:arrow-left-linear" className="size-3" />
          返回用户中心
        </Link>
      </div>
    </div>
  );
}
