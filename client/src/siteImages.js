import { useEffect, useState } from 'react';

export const SITE_IMAGE_KEYS = ['heroHome', 'heroWomen', 'heroMen', 'heroKids', 'promo', 'catWomen', 'catMen', 'catKids'];

export const DEFAULT_SITE_IMAGES = {
  heroHome: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
  heroWomen: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1600&q=80',
  heroMen: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1600&q=80',
  heroKids: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1600&q=80',
  promo: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
  catWomen: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80',
  catMen: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&q=80',
  catKids: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80'
};

let cache = null;
let inflight = null;

export function fetchSiteImages() {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch('/api/settings/site')
    .then((r) => (r.ok ? r.json() : {}))
    .then((d) => {
      cache = { ...DEFAULT_SITE_IMAGES, ...(d || {}) };
      // drop empty overrides
      for (const k of SITE_IMAGE_KEYS) {
        if (!cache[k]) cache[k] = DEFAULT_SITE_IMAGES[k];
      }
      return cache;
    })
    .catch(() => {
      cache = { ...DEFAULT_SITE_IMAGES };
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useSiteImages() {
  const [images, setImages] = useState(cache || DEFAULT_SITE_IMAGES);
  useEffect(() => {
    fetchSiteImages().then(setImages);
  }, []);
  return images;
}

export const SITE_TEXT_KEYS = ['announcement', 'perk1Title', 'perk1Text', 'perk2Title', 'perk2Text', 'perk3Title', 'perk3Text'];

export function useSiteTexts() {
  const [texts, setTexts] = useState(() => {
    const t = {};
    if (cache) for (const k of SITE_TEXT_KEYS) t[k] = cache[k] || '';
    return t;
  });
  useEffect(() => {
    fetchSiteImages().then((site) => {
      const t = {};
      for (const k of SITE_TEXT_KEYS) t[k] = site[k] || '';
      setTexts(t);
    });
  }, []);
  return texts;
}
