export const calculateDiscountPrice = (price, offerPercent) => {
  if (!offerPercent || offerPercent <= 0) return price;
  return Math.round(price - (price * (offerPercent / 100)));
};
