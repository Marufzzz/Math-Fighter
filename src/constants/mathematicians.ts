export interface Mathematician {
  id: string;
  name: string;
  avatar: string; // Emoji/Icon
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
  intro: string;
  history: string;
  victoryQuote: string;
  defeatQuote: string;
  specialty: string; // e.g. "Geometry", "Calculus"
}

export const MATHEMATICIANS: Mathematician[] = [
  {
    id: 'pythagoras',
    name: 'Pythagoras',
    avatar: '📐',
    color: '#3b82f6',
    difficulty: 'easy',
    specialty: 'The Theorem of Harmony',
    intro: "Welcome to Samos, traveler. Do you believe everything in the universe is number? Let's test your harmony!",
    history: "Pythagoras of Samos (c. 570–495 BC) was an ancient Greek philosopher who founded Pythagoreanism. He is best known for the Pythagorean theorem: a² + b² = c² in right-angled triangles. He believed the world was governed by numbers and musical ratios.",
    victoryQuote: "The triangles remain in balance. You need more practice, child.",
    defeatQuote: "A² + B² certainly equals... your brilliance! You have found the ratio."
  },
  {
    id: 'hypatia',
    name: 'Hypatia',
    avatar: '🏺',
    color: '#ec4899',
    difficulty: 'easy',
    specialty: 'The Philosophy of Stars',
    intro: "The stars speak in the language of points and lines. Can you read their mathematical poetry?",
    history: "Hypatia of Alexandria (c. 350–415 AD) was a Neoplatonist philosopher, astronomer, and mathematician in Egypt. She was one of the first women to teach math and science. She was renowned for her work on conic sections and planetary motion.",
    victoryQuote: "Logic is the beginning of wisdom, but not the end.",
    defeatQuote: "Your mind is as sharp as a celestial compass. Proceed to the next sphere."
  },
  {
    id: 'newton',
    name: 'Sir Isaac Newton',
    avatar: '🍎',
    color: '#8b5cf6',
    difficulty: 'medium',
    specialty: 'The Laws of Motion',
    intro: "If I have seen further, it is by standing on the shoulders of giants. Let's see if you can stand on your own!",
    history: "Isaac Newton (1642–1727) was an English physicist and mathematician. He co-discovered calculus and formulated the laws of motion and universal gravitation. Legend says an apple falling from a tree inspired his theory of gravity.",
    victoryQuote: "An object at rest stays at rest... especially after that hit.",
    defeatQuote: "Gravity always wins, but today, your intellect was the greater force!"
  },
  {
    id: 'lovelace',
    name: 'Ada Lovelace',
    avatar: '⚙️',
    color: '#10b981',
    difficulty: 'medium',
    specialty: 'The Poetical Science',
    intro: "I am building a machine of pure logic. Can your organic brain compute faster than my Analytical Engine?",
    history: "Ada Lovelace (1815–1852) was an English mathematician and writer. She is often called the first computer programmer for her work on Charles Babbage's early mechanical general-purpose computer, the Analytical Engine.",
    victoryQuote: "The numbers have crunched you. Error 404: Victory not found.",
    defeatQuote: "Extraordinary! You've found the algorithm for success."
  },
  {
    id: 'einstein',
    name: 'Albert Einstein',
    avatar: '🌌',
    color: '#f59e0b',
    difficulty: 'hard',
    specialty: 'Space-Time Relativity',
    intro: "Time is relative, but this match will be over quickly if you don't focus. E=mc², baby!",
    history: "Albert Einstein (1879–1955) was a German-born theoretical physicist. He is best known for developing the theory of relativity and the world's most famous equation, E=mc², which revealed the relationship between mass and energy.",
    victoryQuote: "Imagination is more important than knowledge... but knowledge would have helped you here.",
    defeatQuote: "Relatively speaking, you are a genius! The universe is yours to explore."
  }
];
