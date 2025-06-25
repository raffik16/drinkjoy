import { WizardQuestion } from '@/app/types/wizard';

export const wizardQuestions: WizardQuestion[] = [
  {
    id: 'flavor',
    title: "What's your vibe?",
    subtitle: "Pick your flavor personality",
    options: [
      { value: 'sweet', label: 'Sweet Tooth', emoji: '🍬' },
      { value: 'bitter', label: 'Bitter is Better', emoji: '🌿' },
      { value: 'sour', label: 'Sour Power', emoji: '🍋' },
      { value: 'smooth', label: 'Smooth Operator', emoji: '🥃' }
    ]
  },
  {
    id: 'temperature',
    title: "How do you like to chill?",
    subtitle: "Your ideal serving temperature",
    options: [
      { value: 'cold', label: 'Ice Cold', emoji: '❄️' },
      { value: 'cool', label: 'Cool & Refreshing', emoji: '🌊' },
      { value: 'room', label: 'Room Temp', emoji: '🌡️' },
      { value: 'warm', label: 'Warm & Cozy', emoji: '☕' }
    ]
  },
  {
    id: 'adventure',
    title: "Pick your adventure style",
    subtitle: "How bold are you feeling?",
    options: [
      { value: 'classic', label: 'Classic & Timeless', emoji: '🎩' },
      { value: 'bold', label: 'Bold & Experimental', emoji: '🚀' },
      { value: 'fruity', label: 'Fruity & Fun', emoji: '🌴' },
      { value: 'simple', label: 'Simple & Clean', emoji: '💎' }
    ]
  },
  {
    id: 'strength',
    title: "What's your power level?",
    subtitle: "Choose your strength",
    options: [
      { value: 'light', label: 'Easy Going', emoji: '🌸' },
      { value: 'medium', label: 'Balanced', emoji: '⚖️' },
      { value: 'strong', label: 'Bring the Heat', emoji: '🔥' },
      { value: 'non-alcoholic', label: 'Zero Proof Hero', emoji: '🦸' }
    ]
  },
  {
    id: 'occasion',
    title: "What's the occasion?",
    subtitle: "Where are you drinking?",
    options: [
      { value: 'casual', label: 'Happy Hour', emoji: '🍺' },
      { value: 'celebration', label: 'Celebrating', emoji: '🥂' },
      { value: 'business', label: 'Business Meeting', emoji: '💼' },
      { value: 'romantic', label: 'Romantic Dinner', emoji: '🌹' }
    ]
  }
];