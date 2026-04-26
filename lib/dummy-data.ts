/**
 * Pulse Ecosystem Dummy Data Generator
 * Matured, High-Fidelity Data for Demo Synchronization
 */

import { User, Megaphone, TrendingUp, Package, ShoppingBag, Box, Clock, ShieldCheck, Zap } from 'lucide-react';

export const GENERATE_INBOX_ITEMS = () => {
  const items = [];
  const types = ['ACCOUNT ACTIVITY', 'PROMOTIONS', 'NEWS', 'UPDATES'];
  const locations = ['Library East', 'Block A Cafe', 'MIIT Level 4', 'V1 Hostel', 'Student Lounge'];
  const foods = ['Nasi Lemak Ayam', 'Mee Goreng Mamak', 'Iced Milo', 'Chicken Chop', 'Teh Tarik'];
  const names = ['Amirul', 'Muhaimizu', 'Farhan', 'Iyad', 'Sarah', 'Danish', 'Ariff', 'Nurul'];

  for (let i = 1; i <= 50; i++) {
    const isUnread = i <= 3;
    const type = types[Math.floor(Math.random() * types.length)];
    const time = i < 5 ? `${i * 10}m` : i < 15 ? `${Math.floor(i/2)}h` : `JUL ${Math.floor(Math.random() * 30) + 1}`;
    
    let title = '';
    let subtitle = '';
    let icon: any = Package;
    let avatarUrl = '';
    let extraAction = '';

    if (type === 'ACCOUNT ACTIVITY') {
      const name = names[Math.floor(Math.random() * names.length)];
      const food = foods[Math.floor(Math.random() * foods.length)];
      const variant = Math.random();
      
      if (variant > 0.6) {
        title = `You received an order handshake from ${name}.`;
        subtitle = `Protocol sync initiated for ${food}. Verify at ${locations[Math.floor(Math.random() * locations.length)]}.`;
        avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
      } else {
        title = `Congratulations! Your RM${(Math.random() * 15 + 5).toFixed(2)} purchase of ${food} is complete.`;
        subtitle = `Your meal is now available for collection. Check your digital receipt.`;
        icon = ShoppingBag;
      }
    } else if (type === 'NEWS') {
      title = `Pulse Broadcast: ${locations[Math.floor(Math.random() * locations.length)]} maintenance scheduled.`;
      subtitle = `Expect minor disruptions in service availability between 2PM and 5PM.`;
      icon = Megaphone;
      extraAction = 'View Details';
    } else if (type === 'PROMOTIONS') {
      title = `Flash Drop: 20% OFF on all ${foods[Math.floor(Math.random() * foods.length)]} orders.`;
      subtitle = `Limited time offer for UniKL MIIT students. Valid at ${locations[Math.floor(Math.random() * locations.length)]}.`;
      icon = TrendingUp;
      extraAction = 'Claim Voucher';
    } else {
      title = `Trending Alert: ${foods[Math.floor(Math.random() * foods.length)]} is trending!`;
      subtitle = `+${(Math.random() * 10 + 2).toFixed(1)}% orders in the last ${Math.floor(Math.random() * 12) + 1} hours.`;
      icon = Zap;
    }

    items.push({
      id: `inbox-${i}`,
      type,
      title,
      subtitle,
      statusText: time,
      isUnread,
      icon,
      avatarUrl,
      extraAction
    });
  }
  return items;
};

export const GENERATE_MESSAGE_ITEMS = () => {
  const convos = [];
  const names = [
    { name: 'Iyad (Carrier)', type: 'LOGISTICS' },
    { name: 'Muhaimizu', type: 'MARKET' },
    { name: 'Farhan (MIIT)', type: 'MARKET' },
    { name: 'Sarah (Vendor)', type: 'MERCHANT' },
    { name: 'Ariff (Runner)', type: 'LOGISTICS' },
    { name: 'Danish', type: 'MARKET' },
    { name: 'Pulse Admin', type: 'SYSTEM' },
    { name: 'Student Council', type: 'SYSTEM' }
  ];
  
  const lastMessages = [
    'Handshake prepared. See you at Level 4.',
    'Is the Tech Hoodie still available for sync?',
    'Thanks for the quick dispatch! Verified.',
    'Your order is ready for pickup at our Terminal.',
    'Can you deliver to V1 Block B instead?',
    'The QR code is not scanning on my end.',
    'Payment confirmed. Thank you!',
    'I am arriving at the location now.'
  ];

  for (let i = 1; i <= 50; i++) {
    const nameObj = names[i % names.length];
    const unread = i <= 2 ? 1 : 0;
    
    convos.push({
      id: i,
      name: nameObj.name,
      lastMsg: lastMessages[Math.floor(Math.random() * lastMessages.length)],
      time: i < 5 ? `${i * 12}m` : `${Math.floor(i/2)}h`,
      unread,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nameObj.name}${i}`,
      type: nameObj.type,
      online: Math.random() > 0.5
    });
  }
  return convos;
};
