export function shortAddress(address, left = 6, right = 4) {
  if (!address || address.length < left + right) return address || '';
  return `${address.slice(0, left)}...${address.slice(-right)}`;
}

export function isHexAddressLike(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value || '');
}
