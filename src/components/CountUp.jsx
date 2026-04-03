import { useEffect, useRef, useState } from 'react';

export default function CountUp({ target, duration = 1400, suffix = '', decimals = 0 }) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const nodeRef = useRef(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    let frameId = 0;
    let startTime = 0;

    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      setValue(target * progress);
      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [started, duration, target]);

  const text = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <span ref={nodeRef}>
      {text}
      {suffix}
    </span>
  );
}
