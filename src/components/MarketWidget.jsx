import { useEffect, useMemo, useRef, useState } from 'react';
import AppIcon from './AppIcon';
import './MarketWidget.css';

const TOKENS = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    pair: 'BTCUSDT',
    bg: 'linear-gradient(135deg,#f7931a,#ffc246)',
    iconify: 'simple-icons:bitcoin'
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    pair: 'ETHUSDT',
    bg: '#627eea',
    iconify: 'simple-icons:ethereum'
  },
  BSC: {
    symbol: 'BSC',
    name: 'BNB Smart Chain',
    pair: 'BNBUSDT',
    bg: '#f0b90b',
    iconify: 'simple-icons:bnbchain'
  }
};

const TIMEFRAMES = [
  { key: '1H', label: '1H', interval: '1m', limit: 60 },
  { key: '4H', label: '4H', interval: '5m', limit: 48 },
  { key: '1D', label: '1D', interval: '15m', limit: 96 },
  { key: '1W', label: '1W', interval: '4h', limit: 42 },
  { key: '1M', label: '1M', interval: '1d', limit: 30 }
];

function formatPrice(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '--';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: amount >= 1000 ? 2 : 4
  });
}

function formatCompact(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '--';
  if (amount >= 1e12) return `${(amount / 1e12).toFixed(2)}T`;
  if (amount >= 1e9) return `${(amount / 1e9).toFixed(2)}B`;
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M`;
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatChange(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '--';
  return `${amount >= 0 ? '+' : ''}${amount.toFixed(2)}%`;
}

function formatTooltipTime(timestamp) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function buildChartPoints(values, width, height, pad = 12) {
  const numeric = values.map((value) => Number(value || 0));
  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const range = max - min || 1;

  return numeric.map((value, index) => {
    const x = (index / Math.max(numeric.length - 1, 1)) * width;
    const y = pad + (1 - (value - min) / range) * (height - pad * 2);
    return { x, y, value };
  });
}

function getChartPath(points) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
}

export default function MarketWidget() {
  const [activeToken, setActiveToken] = useState('BTC');
  const [activeTimeframe, setActiveTimeframe] = useState('1D');
  const [tickerData, setTickerData] = useState({});
  const [klineData, setKlineData] = useState({});
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [chartWidth, setChartWidth] = useState(680);
  const [error, setError] = useState('');
  const chartWrapRef = useRef(null);

  const activeTokenConfig = TOKENS[activeToken];
  const activeTicker = tickerData[activeToken] || {};
  const activeKlines = klineData[`${activeToken}:${activeTimeframe}`] || [];
  const change = Number(activeTicker.priceChangePercent || 0);
  const isUp = change >= 0;

  useEffect(() => {
    let cancelled = false;

    const syncWidth = () => {
      if (chartWrapRef.current) {
        setChartWidth(chartWrapRef.current.clientWidth || 680);
      }
    };

    syncWidth();
    window.addEventListener('resize', syncWidth);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', syncWidth);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTickers = async () => {
      try {
        setError('');
        const entries = await Promise.all(
          Object.entries(TOKENS).map(async ([key, token]) => {
            const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${token.pair}`);
            if (!response.ok) {
              throw new Error('行情接口请求失败');
            }
            return [key, await response.json()];
          })
        );

        if (!cancelled) {
          setTickerData(Object.fromEntries(entries));
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : '行情加载失败');
        }
      }
    };

    void loadTickers();
    const timer = window.setInterval(() => {
      void loadTickers();
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadKlines = async () => {
      const timeframe = TIMEFRAMES.find((item) => item.key === activeTimeframe);
      if (!timeframe) return;

      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${activeTokenConfig.pair}&interval=${timeframe.interval}&limit=${timeframe.limit}`
        );
        if (!response.ok) {
          throw new Error('图表数据加载失败');
        }
        const data = await response.json();
        if (!cancelled) {
          setKlineData((prev) => ({
            ...prev,
            [`${activeToken}:${activeTimeframe}`]: data
          }));
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : '图表数据加载失败');
        }
      }
    };

    void loadKlines();
    return () => {
      cancelled = true;
    };
  }, [activeToken, activeTimeframe, activeTokenConfig.pair]);

  const chartValues = useMemo(() => {
    if (!activeKlines.length) {
      const fallback = Number(activeTicker.lastPrice || 0);
      return Array.from({ length: 24 }, () => fallback);
    }
    return activeKlines.map((item) => Number(item[4]));
  }, [activeKlines, activeTicker.lastPrice]);

  const chartPoints = useMemo(() => buildChartPoints(chartValues, chartWidth, 200), [chartValues, chartWidth]);
  const chartPath = useMemo(() => getChartPath(chartPoints), [chartPoints]);
  const chartColor = isUp ? '#caff00' : '#ff2d78';
  const fillPath = chartPoints.length
    ? `${chartPath} L${chartPoints[chartPoints.length - 1].x},200 L0,200 Z`
    : '';

  const selectedPoint = hoverIndex >= 0 ? chartPoints[hoverIndex] : chartPoints[chartPoints.length - 1];
  const selectedKline = hoverIndex >= 0 ? activeKlines[hoverIndex] : activeKlines[activeKlines.length - 1];

  const handleMouseMove = (event) => {
    if (!chartWrapRef.current || !chartPoints.length) return;
    const rect = chartWrapRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const index = Math.max(0, Math.min(chartPoints.length - 1, Math.round((x / rect.width) * (chartPoints.length - 1))));
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(-1);
  };

  return (
    <div className="market-widget">
      {error ? <div className="market-widget__error">{error}</div> : null}

      <div className="market-widget__header">
        <div className="market-widget__left">
          <div className="market-widget__icon" style={{ background: activeTokenConfig.bg }}>
            <AppIcon icon={activeTokenConfig.iconify} className="text-[20px] text-white" />
          </div>
          <div>
            <div className="market-widget__symbol">{activeTokenConfig.symbol}</div>
            <div className="market-widget__name">
              {activeTokenConfig.name}
              <span className="market-widget__live-dot" />
              Live
            </div>
          </div>
        </div>

        <div className="market-widget__right">
          <div className={`market-widget__price ${isUp ? 'up' : 'down'}`}>
            ${formatPrice(activeTicker.lastPrice)}
          </div>
          <div className={`market-widget__delta ${isUp ? 'up' : 'down'}`}>
            {isUp ? '▲' : '▼'} {formatChange(change)}
          </div>
        </div>
      </div>

      <div className="market-widget__tabs">
        {Object.entries(TOKENS).map(([key, token]) => (
          <button
            key={key}
            type="button"
            className={`market-widget__tab ${activeToken === key ? 'active' : ''}`}
            onClick={() => {
              setActiveToken(key);
              setHoverIndex(-1);
            }}
          >
            <span className="market-widget__tab-icon" style={{ background: token.bg }}>
              <AppIcon icon={token.iconify} className="text-[11px] text-white" />
            </span>
            {token.symbol}
          </button>
        ))}
      </div>

      <div className="market-widget__timeframes">
        {TIMEFRAMES.map((timeframe) => (
          <button
            key={timeframe.key}
            type="button"
            className={`market-widget__timeframe ${activeTimeframe === timeframe.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTimeframe(timeframe.key);
              setHoverIndex(-1);
            }}
          >
            {timeframe.label}
          </button>
        ))}
      </div>

      <div
        ref={chartWrapRef}
        className="market-widget__chart-wrap"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg className="market-widget__chart" viewBox={`0 0 ${chartWidth} 200`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="market-widget-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.22" />
              <stop offset="75%" stopColor={chartColor} stopOpacity="0.04" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
            </linearGradient>
            <filter id="market-widget-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[0.25, 0.5, 0.75].map((line) => (
            <line
              key={line}
              x1="0"
              y1={line * 200}
              x2={chartWidth}
              y2={line * 200}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}

          {fillPath ? <path d={fillPath} fill="url(#market-widget-gradient)" /> : null}
          {chartPath ? <path d={chartPath} fill="none" stroke={chartColor} strokeWidth="2" opacity="0.9" filter="url(#market-widget-glow)" /> : null}

          {selectedPoint ? (
            <>
              <circle cx={selectedPoint.x} cy={selectedPoint.y} r="4" fill={chartColor} opacity="0.95" />
              <circle cx={selectedPoint.x} cy={selectedPoint.y} r="9" fill="none" stroke={chartColor} strokeWidth="1" opacity="0.3" />
            </>
          ) : null}
        </svg>

        {selectedPoint ? (
          <>
            <div
              className="market-widget__crosshair-line"
              style={{ left: `${selectedPoint.x}px`, opacity: 1 }}
            />
            <div
              className="market-widget__crosshair-dot"
              style={{ left: `${selectedPoint.x}px`, top: `${selectedPoint.y}px`, opacity: 1, background: chartColor, boxShadow: `0 0 10px ${chartColor}` }}
            />
            <div
              className="market-widget__tooltip"
              style={{
                left: `${Math.min(selectedPoint.x + 14, chartWidth - 130)}px`,
                top: `${Math.max(selectedPoint.y - 30, 0)}px`,
                opacity: 1
              }}
            >
              <div className="market-widget__tooltip-price">${formatPrice(selectedPoint.value)}</div>
              <div className="market-widget__tooltip-time">{formatTooltipTime(selectedKline?.[6])}</div>
            </div>
          </>
        ) : null}
      </div>

      <div className="market-widget__stats">
        <div>
          <div className="market-widget__stat-label">24h High</div>
          <div className="market-widget__stat-value up">${formatPrice(activeTicker.highPrice)}</div>
        </div>
        <div>
          <div className="market-widget__stat-label">24h Low</div>
          <div className="market-widget__stat-value down">${formatPrice(activeTicker.lowPrice)}</div>
        </div>
        <div>
          <div className="market-widget__stat-label">Volume</div>
          <div className="market-widget__stat-value">{formatCompact(activeTicker.quoteVolume)}</div>
        </div>
        <div>
          <div className="market-widget__stat-label">Close Time</div>
          <div className="market-widget__stat-value">{formatTooltipTime(activeTicker.closeTime)}</div>
        </div>
      </div>
    </div>
  );
}
