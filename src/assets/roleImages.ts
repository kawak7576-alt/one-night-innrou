import animeWolfAvatar from './images/anime_wolf_avatar_1791112852812.jpg';
import animeVillager from './images/anime_villager_1791111579756.jpg';
import animeSeer from './images/anime_seer_1791111597572.jpg';
import animeThief from './images/anime_thief_1791111613085.jpg';
import animeHunter from './images/anime_hunter_1791111627794.jpg';
import animeWerewolf from './images/anime_werewolf_1791111641708.jpg';
import animeGreatWerewolf from './images/anime_greatwolf_1791111655849.jpg';
import animeTanner from './images/anime_tanner_1791111671092.jpg';
import { RoleId, Team } from '../types/game';

export const ROLE_IMAGES: Record<RoleId, string> = {
  villager: animeVillager,
  seer: animeSeer,
  thief: animeThief,
  hunter: animeHunter,
  werewolf: animeWerewolf,
  great_werewolf: animeGreatWerewolf,
  tanner: animeTanner,
};

export const APP_AVATAR = animeWolfAvatar;

// Unified team colors as requested:
// 村人陣営 = 緑色 (Green)
// 人狼陣営 = 赤色 (Red)
// 吊人陣営 = 紫色 (Purple)
export const TEAM_COLORS: Record<Team, {
  name: string;
  badgeClass: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  hex: string;
}> = {
  villager: {
    name: '村人陣営',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-emerald-950/40',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/60',
    borderClass: 'border-emerald-500',
    hex: '#10b981',
  },
  werewolf: {
    name: '人狼陣営',
    badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-rose-950/40',
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-950/60',
    borderClass: 'border-rose-500',
    hex: '#f43f5e',
  },
  tanner: {
    name: '吊人陣営',
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-purple-950/40',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-950/60',
    borderClass: 'border-purple-500',
    hex: '#a855f7',
  },
};
