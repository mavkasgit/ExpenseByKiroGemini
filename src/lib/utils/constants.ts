export const availableColors = [
  '#6366f1', // Индиго
  '#ef4444', // Красный
  '#10b981', // Зеленый
  '#f59e0b', // Желтый
  '#8b5cf6', // Фиолетовый
  '#06b6d4', // Голубой
  '#f97316', // Оранжевый
  '#84cc16', // Лайм
  '#ec4899', // Розовый
  '#6b7280', // Серый
  '#14b8a6', // Бирюзовый
  '#f43f5e', // Роза
];

export const availableIcons = [
  { key: 'shopping-bag', emoji: '🛍️', names: ['покупки', 'магазин'] },
  { key: 'car', emoji: '🚗', names: ['машина', 'транспорт'] },
  { key: 'home', emoji: '🏠', names: ['дом', 'жилье'] },
  { key: 'food', emoji: '🍽️', names: ['еда', 'ресторан'] },
  { key: 'health', emoji: '🏥', names: ['здоровье', 'медицина'] },
  { key: 'entertainment', emoji: '🎬', names: ['развлечения', 'кино'] },
  { key: 'education', emoji: '📚', names: ['образование', 'учеба'] },
  { key: 'travel', emoji: '✈️', names: ['путешествия', 'поездки'] },
  { key: 'other', emoji: '📦', names: ['другое', 'прочее'] },
];

export const getRandomColor = () => {
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};
