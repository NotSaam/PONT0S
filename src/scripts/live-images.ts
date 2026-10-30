// Refresca las fotos de cámara (type «image») solo mientras se ven y la pestaña está delante.
// Cada foto nueva se precarga aparte y se cambia cuando ha llegado: sin parpadeos ni huecos.

export function startLiveImages(root: ParentNode, onUpdate?: (img: HTMLImageElement, at: Date) => void) {
  const imgs = [...root.querySelectorAll<HTMLImageElement>('img[data-live]')];
  if (!imgs.length) return;
  const visible = new Set<HTMLImageElement>();
  const timers = new Map<HTMLImageElement, number>();

  const refresh = (img: HTMLImageElement) => {
    const base = img.dataset.live!;
    const next = new Image();
    next.referrerPolicy = 'no-referrer';
    const sep = base.includes('?') ? '&' : '?';
    next.onload = () => {
      img.src = next.src;
      img.classList.remove('is-stale');
      onUpdate?.(img, new Date());
    };
    next.onerror = () => img.classList.add('is-stale');
    next.src = `${base}${sep}_=${Math.floor(Date.now() / 1000)}`;
  };

  const schedule = (img: HTMLImageElement) => {
    if (timers.has(img)) return;
    const every = Math.max(20, Number(img.dataset.refresh) || 60) * 1000;
    timers.set(img, window.setInterval(() => !document.hidden && refresh(img), every));
  };
  const stop = (img: HTMLImageElement) => {
    clearInterval(timers.get(img));
    timers.delete(img);
  };

  for (const img of imgs) {
    img.addEventListener('error', () => img.classList.add('is-stale'), { once: true });
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const img = e.target as HTMLImageElement;
        if (e.isIntersecting) {
          visible.add(img);
          schedule(img);
        } else {
          visible.delete(img);
          stop(img);
        }
      }
    },
    { rootMargin: '100px' },
  );
  imgs.forEach((i) => io.observe(i));

  // Al volver a la pestaña, poner al día lo que se ve sin esperar al siguiente ciclo.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) visible.forEach(refresh);
  });
}
