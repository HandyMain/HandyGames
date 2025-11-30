
export const DATA_SETS = {
  uppercase: Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
  lowercase: Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)),
  numbers: Array.from({ length: 21 }, (_, i) => String(i)), // 0-20
};

export type DatasetKey = keyof typeof DATA_SETS;

export const LETTER_OBJECTS: Record<string, { emoji: string, name: string }> = {
  a: { emoji: '🍎', name: 'Apple' }, b: { emoji: '🐻', name: 'Bear' },
  c: { emoji: '🐱', name: 'Cat' }, d: { emoji: '🐶', name: 'Dog' },
  e: { emoji: '🐘', name: 'Elephant' }, f: { emoji: '🐟', name: 'Fish' },
  g: { emoji: '🦒', name: 'Giraffe' }, h: { emoji: '🏠', name: 'House' },
  i: { emoji: '🍦', name: 'Ice Cream' }, j: { emoji: '🪼', name: 'Jellyfish' },
  k: { emoji: '🪁', name: 'Kite' }, l: { emoji: '🦁', name: 'Lion' },
  m: { emoji: '🐒', name: 'Monkey' }, n: { emoji: '🐦', name: 'Nest' },
  o: { emoji: '🐙', name: 'Octopus' }, p: { emoji: '🐧', name: 'Penguin' },
  q: { emoji: '👑', name: 'Queen' }, r: { emoji: '🌈', name: 'Rainbow' },
  s: { emoji: '🐍', name: 'Snake' }, t: { emoji: '🐯', name: 'Tiger' },
  u: { emoji: '🦄', name: 'Unicorn' }, v: { emoji: '🎻', name: 'Violin' },
  w: { emoji: '🐳', name: 'Whale' }, x: { emoji: '🎹', name: 'Xylophone' },
  y: { emoji: '🧶', name: 'Yarn' }, z: { emoji: '🦓', name: 'Zebra' },
};

export interface BibleQuestion { 
    id: string; 
    q: string; 
    fact: string; 
    name: string; 
    e: string; 
    ref: string;
    story: string;
}

export const BIBLE_DATA: BibleQuestion[] = [
  { 
    id: 'noah', q: "Can you find the big Ark?", fact: "Noah built the Ark.", name: "Noah", e: "⛴️",
    ref: "Genesis 6-9",
    story: "God told Noah to build a giant boat called an Ark. He brought two of every animal inside, like lions and bunnies! Then it rained for 40 days, but Noah and the animals were safe and dry inside the boat."
  },
  { 
    id: 'david', q: "Can you find the smooth stone?", fact: "David fought the giant Goliath.", name: "David", e: "🪨",
    ref: "1 Samuel 17",
    story: "Goliath was a huge giant that scared everyone. But David was a brave shepherd boy. He took a smooth stone and his sling, and with God's help, he defeated the giant!"
  },
  { 
    id: 'jonah', q: "Can you find the big whale?", fact: "Jonah was swallowed by a whale.", name: "Jonah", e: "🐋",
    ref: "Jonah 1-2",
    story: "Jonah ran away from God on a ship. A big storm came, and Jonah went into the water. A giant fish swallowed him up! Jonah prayed inside the fish for three days until the fish spit him out on land."
  },
  { 
    id: 'daniel', q: "Can you find the lion?", fact: "Daniel was safe in the lions' den.", name: "Daniel", e: "🦁",
    ref: "Daniel 6",
    story: "Daniel loved to pray to God. Some bad men threw him into a pit full of hungry lions. But God sent an angel to shut the lions' mouths, and Daniel was not hurt at all!"
  },
  { 
    id: 'moses', q: "Can you find the ocean?", fact: "Moses parted the Red Sea.", name: "Moses", e: "🌊",
    ref: "Exodus 14",
    story: "Moses led God's people out of Egypt. When they got to the big Red Sea, God made a strong wind blow. The water split apart so they could walk across on dry ground!"
  },
  { 
    id: 'jesus', q: "Can you find the baby?", fact: "Baby Jesus was born in a stable.", name: "Jesus", e: "👶",
    ref: "Luke 2",
    story: "Mary and Joseph traveled to Bethlehem. There were no rooms left, so they stayed in a stable with the animals. Baby Jesus was born there and slept in a manger full of hay."
  },
  { 
    id: 'joseph', q: "Can you find the colorful coat?", fact: "Joseph wore a coat of many colors.", name: "Joseph", e: "🧥",
    ref: "Genesis 37",
    story: "Joseph's father loved him very much and gave him a beautiful coat with many bright colors. His brothers were jealous, but God had a special plan for Joseph to become a leader."
  },
  { 
    id: 'samson', q: "Can you find the strong muscles?", fact: "Samson was the strongest man.", name: "Samson", e: "💪",
    ref: "Judges 13-16",
    story: "God gave Samson super strength! He could lift heavy gates and fight bad guys. His strength came from God, and as long as he didn't cut his hair, he stayed strong."
  },
  { 
    id: 'king', q: "Can you find the crown?", fact: "Solomon was a wise King.", name: "Solomon", e: "👑",
    ref: "1 Kings 3",
    story: "Solomon could have asked God for anything, like gold or toys. Instead, he asked for wisdom to be a good King. God was so happy that He gave Solomon wisdom AND riches!"
  },
  { 
    id: 'shepherd', q: "Can you find the sheep?", fact: "David was a shepherd boy.", name: "Shepherd", e: "🐑",
    ref: "Psalm 23",
    story: "Before he was a King, David took care of sheep in the fields. He protected them from bears and lions. He wrote songs about how God is like a Good Shepherd who takes care of us."
  },
  { 
    id: 'creation', q: "Can you find the world?", fact: "God made the whole world.", name: "God", e: "🌍",
    ref: "Genesis 1",
    story: "In the beginning, there was nothing. Then God said 'Let there be light!' He made the sun, the moon, the trees, the animals, and people. He made everything good."
  },
  { 
    id: 'fish', q: "Can you find the fish?", fact: "Jesus fed 5000 people.", name: "Miracle", e: "🐟",
    ref: "Matthew 14",
    story: "A huge crowd was hungry. A little boy shared his lunch—just five loaves of bread and two fish. Jesus prayed, and the food multiplied to feed thousands of people!"
  },
  { 
    id: 'dove', q: "Can you find the dove?", fact: "The dove returned to Noah.", name: "Hope", e: "🕊️",
    ref: "Genesis 8",
    story: "Noah wanted to know if the water was gone after the flood. He sent out a dove. The dove came back with an olive leaf, showing that trees were growing again!"
  },
  { 
    id: 'commandments', q: "Can you find the scroll?", fact: "Moses received the 10 commandments.", name: "Moses", e: "📜",
    ref: "Exodus 20",
    story: "Moses climbed up Mount Sinai. God gave him ten special rules to help people live good lives. Rules like 'Honor your father and mother' and 'Do not steal'."
  }
];
