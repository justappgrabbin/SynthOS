"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

// ═══════════════════════════════════════════════════════════════════════════════
//  THE GRIMOIRE 2.0 — Synth AI Notebook with Native World Forge
//  Jupyter × Obsidian × Notebook LM × Notepad.js × MorphOS v29
//  Sheldon Klein's Auto-Novel + 5-Layer GNN Matrix + MediaRecorder Pipeline
//  Zero APIs. Zero outsourcing. Pure browser. Deterministic. Regenerative.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── TYPE DEFINITIONS ─────────────────────────────────────────────────────────

interface NotebookEntry {
  id: string;
  timestamp: string;
  type: 'observation' | 'hypothesis' | 'spell' | 'reflection' | 'divination' | 'code' | 'canvas' | 'synthesis' | 'world';
  content: string;
  echo?: string;
  tags: string[];
  resonance_score: number;
  links: string[];
  metadata?: {
    worldSeed?: number;
    worldParams?: WorldParams;
    chapterText?: string;
    snapshotJSON?: string;
    videoBlobUrl?: string;
    cyclesCompleted?: number;
    finalCoherence?: number;
    layerWeights?: number[];
    [key: string]: any;
  };
}

interface WorldParams {
  seed: number;
  totalNodes: number;
  nodeCount: number;
  palette: 'void' | 'biolumen' | 'copper' | 'solar';
  speed: number;
  trailDecay: number;
}

interface GraphNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  entry: NotebookEntry;
  radius: number;
}

// ─── MOCK HOOKS (replace with your real implementations) ─────────────────────

const usePyodide = () => ({
  runPythonAsync: async (_code: string) => {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        const lines = Array.from({ length: 6 }, () => {
          const total = [2,2,2,3,3,3,3,3,3][Math.floor(Math.random() * 9)];
          if (total === 6) return { value: 6, type: "old_yin", changing: true, symbol: "---x---" };
          if (total === 7) return { value: 7, type: "young_yang", changing: false, symbol: "---------" };
          if (total === 8) return { value: 8, type: "young_yin", changing: false, symbol: "--- ---" };
          return { value: 9, type: "old_yang", changing: true, symbol: "----o----" };
        });
        const primary_binary = lines.map((l: any) => String(l.value % 2)).reverse().join('');
        const primary_number = parseInt(primary_binary, 2) + 1;
        const changing = lines.map((l: any, i: number) => l.changing ? i + 1 : null).filter(Boolean);
        resolve(JSON.stringify({ lines, primary_number, changing_lines: changing }));
      }, 800);
    });
  },
  isReady: true,
});

const useHumanDesign = () => ({
  profile: { type: 'Manifestor', authority: 'Emotional', strategy: 'Inform' },
});

// ─── I CHING WISDOM DATABASE (abbreviated core set + all 64) ─────────────────

const HEXAGRAM_WISDOM: Record<number, { name: string; meaning: string; changing: Record<number, string> }> = {
  1: { name: "Ch'ien / The Creative", meaning: "The Creative works sublime success, furthering through perseverance. The dragon rises from the depths. Act with clarity and boldness.", changing: { 1: "Hidden dragon. Do not act.", 2: "Dragon appearing in the field.", 3: "All day long the superior man is creatively active.", 4: "Wavering flight over the depths. No blame.", 5: "Flying dragon in the heavens.", 6: "Arrogant dragon will have cause to repent." } },
  2: { name: "K'un / The Receptive", meaning: "The Receptive brings about sublime success, furthering through the perseverance of a mare. Yield to the moment. Receive what is offered.", changing: { 1: "Walking in the frost, hard ice is not far away.", 2: "Straight, square, great. Without purpose, yet everything is furthered.", 3: "Hidden lines. One is able to remain persevering.", 4: "A tied-up sack. No blame, no praise.", 5: "A yellow lower garment brings supreme good fortune.", 6: "Dragons fight in the meadow." } },
  3: { name: "Chun / Difficulty at the Beginning", meaning: "Sprouting from the earth, difficulty at the beginning works supreme success. Do not be afraid of the chaos. The new always arrives disordered.", changing: { 1: "Hesitation and hindrance. It furthers one to remain persevering.", 2: "Difficulties pile up. Horse and wagon part.", 3: "Whoever hunts deer without the forester only loses his way.", 4: "Horse and wagon part. Seek union.", 5: "Difficulties in blessing.", 6: "Horse and wagon part. Bloody tears flow." } },
  4: { name: "Meng / Youthful Folly", meaning: "Youthful folly has success. It is not I who seek the young fool; the young fool seeks me. Be open to being taught.", changing: { 1: "To make a fool develop it furthers one to apply discipline.", 2: "To bear with fools in kindliness brings good fortune.", 3: "Take not a maiden who loses possession of herself.", 4: "Entangled folly brings humiliation.", 5: "Childlike folly brings good fortune.", 6: "In punishing folly it does not further one to commit transgressions." } },
  5: { name: "Hsu / Waiting", meaning: "Waiting. If you are sincere, you have light and success. Perseverance brings good fortune. Patience is not passive; it is active preparation.", changing: { 1: "Waiting in the meadow. It furthers one to abide in what endures.", 2: "Waiting on the sand. There is some gossip.", 3: "Waiting in the mud brings about the arrival of the enemy.", 4: "Waiting in blood. Get out of the pit.", 5: "Waiting at meat and drink. Perseverance brings good fortune.", 6: "One falls into the pit. Three uninvited guests arrive." } },
  6: { name: "Sung / Conflict", meaning: "Conflict. You are sincere and are being obstructed. A cautious halt halfway brings good fortune. Choose your battles with wisdom.", changing: { 1: "If one does not perpetuate the affair, there is a little gossip.", 2: "One cannot engage in conflict; one returns home, gives way.", 3: "To nourish oneself on ancient virtue induces perseverance.", 4: "One turns back and submits to fate, changes one's attitude.", 5: "To contend before him brings supreme good fortune.", 6: "Even if by chance a leather belt is bestowed on one..." } },
  7: { name: "Shih / The Army", meaning: "The Army. The army needs perseverance and a strong man. Good fortune without blame. Leadership requires both discipline and compassion.", changing: { 1: "An army must set forth in proper order.", 2: "In the midst of the army. Good fortune.", 3: "Perchance the army carries corpses in the wagon.", 4: "The army retreats. No blame.", 5: "There is game in the field. It furthers one to catch it.", 6: "The great prince issues commands, founds states." } },
  8: { name: "Pi / Holding Together", meaning: "Holding together brings good fortune. Union requires shared purpose.", changing: { 1: "Hold to him in truth and loyalty.", 2: "Hold to him inwardly. Perseverance brings good fortune.", 3: "You hold together with the wrong people.", 4: "Hold to him outwardly also.", 5: "Manifestation of holding together.", 6: "He finds no head for holding together. Misfortune." } },
  9: { name: "Hsiao Ch'u / The Taming Power of the Small", meaning: "Small forces can restrain large ones through patience and timing. Do not force the issue.", changing: { 1: "Return to the way. How could there be blame?", 2: "He allows himself to be drawn back. Good fortune.", 3: "The spokes burst through the wagon.", 4: "If you are sincere, blood vanishes and fear gives way.", 5: "If you are sincere and loyally attached, you are rich in your neighbor.", 6: "The rain comes, there is rest." } },
  10: { name: "Lu / Treading", meaning: "Treading on the tail of the tiger. It does not bite the man. Success. Boldness tempered with care.", changing: { 1: "Simple treading. Going forward without blame.", 2: "Treading a smooth, level course.", 3: "A one-eyed man is able to see, a lame man is able to tread.", 4: "He treads on the tail of the tiger. Caution brings good fortune.", 5: "Resolute treading. Perseverance with awareness of danger.", 6: "Look to your conduct and weigh the favorable signs." } },
  11: { name: "T'ai / Peace", meaning: "Peace. The small departs, the great approaches. Good fortune. Success. Heaven and earth unite. Act while the way is open.", changing: { 1: "When ribbon grass is pulled up, the stalks wither.", 2: "Bearing with the uncultured in gentleness.", 3: "No plain not followed by a slope.", 4: "He flutters down, not boasting of his wealth.", 5: "The sovereign I gives his daughter in marriage.", 6: "The wall falls back into the moat." } },
  12: { name: "P'i / Standstill", meaning: "Standstill. Evil people do not further the perseverance of the superior man. Do not force action. Cultivate inner worth.", changing: { 1: "When ribbon grass is pulled up, the stalks wither.", 2: "They bear and endure; this means good fortune for inferior people.", 3: "They bear shame.", 4: "He who acts at the command of the highest remains without blame.", 5: "Standstill is giving way. Good fortune for the great man.", 6: "The standstill comes to an end." } },
  13: { name: "T'ung Jen / Fellowship", meaning: "Fellowship with men in the open. Success. True community is built on shared values, not proximity.", changing: { 1: "Fellowship with men at the gate. No blame.", 2: "Fellowship with men in the clan. Humiliation.", 3: "He hides weapons in the thicket.", 4: "He climbs up on his wall; he cannot attack. Good fortune.", 5: "Men unite in fellowship. First weeping and wailing, then laughing.", 6: "Fellowship with men in the meadow. No remorse." } },
  14: { name: "Ta Yu / Possession in Great Measure", meaning: "Possession in great measure. Supreme success. Share your abundance. Do not hoard light.", changing: { 1: "No relationship with what is harmful.", 2: "A big wagon for loading. One may undertake something.", 3: "A prince offers it to the Son of Heaven.", 4: "He makes a difference between himself and his neighbor.", 5: "He whose truth is accessible, yet dignified, has good fortune.", 6: "He is blessed by heaven. Good fortune." } },
  15: { name: "Ch'ien / Modesty", meaning: "Modesty creates success. True power does not announce itself.", changing: { 1: "The superior man of modesty carries things through.", 2: "Modesty that comes to expression. Perseverance brings good fortune.", 3: "A superior man of modesty and merit carries things to conclusion.", 4: "Nothing that would not further modesty in movement.", 5: "No boasting of wealth in one's neighbor.", 6: "It is the way of the superior man to diminish his own light." } },
  16: { name: "Yu / Enthusiasm", meaning: "Enthusiasm. It furthers one to install helpers and to set armies marching. But do not mistake excitement for wisdom.", changing: { 1: "Enthusiasm that expresses itself brings misfortune.", 2: "Firm as a rock. Not a whole day. Perseverance brings good fortune.", 3: "Enthusiasm that looks upward creates remorse.", 4: "The source of enthusiasm. He achieves great things.", 5: "Persistently ill, and still does not die.", 6: "Enthusiasm that has been darkened." } },
  17: { name: "Sui / Following", meaning: "Following has supreme success. Perseverance furthers. To follow is not to submit; it is to move in harmony with the time.", changing: { 1: "The standard is changing. Perseverance brings good fortune.", 2: "If one clings to the little boy, one loses the strong man.", 3: "If one clings to the strong man, one loses the little boy.", 4: "Following creates success. Perseverance brings misfortune.", 5: "Sincere in the great. Good fortune.", 6: "He meets with firm allegiance and is still further bound." } },
  18: { name: "Ku / Work on the Decayed", meaning: "Work on what has been spoiled has supreme success. Decay is not failure; it is the invitation to repair.", changing: { 1: "Setting right what has been spoiled by the father.", 2: "Setting right what has been spoiled by the mother.", 3: "Setting right what has been spoiled by the father.", 4: "Tolerating what has been spoiled by the father.", 5: "Setting right what has been spoiled by the father. One meets with praise.", 6: "He does not serve kings and princes, sets himself higher goals." } },
  19: { name: "Lin / Approach", meaning: "Approach has supreme success. Perseverance furthers. Opportunity is arriving. Prepare to receive it.", changing: { 1: "Joint approach. Perseverance brings good fortune.", 2: "Joint approach. Good fortune.", 3: "Comfortable approach. Nothing that would further.", 4: "Great approach. Good fortune. No blame.", 5: "Wise approach. This is right for a great prince.", 6: "Greathearted approach. Good fortune." } },
  20: { name: "Kuan / Contemplation", meaning: "Contemplation. Observation precedes action. Look deeply before you leap.", changing: { 1: "Boylike contemplation. For an inferior man, no blame.", 2: "Contemplation through the crack of the door.", 3: "Contemplation of my life decides the choice between advance and retreat.", 4: "Contemplation of the light of the kingdom.", 5: "Contemplation of my life. The superior man is without blame.", 6: "Contemplation of his life." } },
  21: { name: "Shih Ho / Biting Through", meaning: "Biting through has success. The moment demands decisive action. Cut through the obstacle.", changing: { 1: "His feet are fastened in the stocks.", 2: "Biting through tender meat, so that his nose disappears.", 3: "Biting on dried meat and hitting on something poisonous.", 4: "Biting on dried meat, receiving metal arrows.", 5: "Biting on dried lean meat. Receiving yellow gold.", 6: "His neck is fastened in the wooden cangue." } },
  22: { name: "Pi / Grace", meaning: "Grace has success. Beauty that does not distract from substance. Form follows function.", changing: { 1: "He lends grace to his toes, leaves the carriage, and walks.", 2: "Lends grace to the beard on his chin.", 3: "Graceful and moist. Constant perseverance brings good fortune.", 4: "Grace or simplicity? A white horse comes as if on wings.", 5: "Grace in hills and gardens.", 6: "Simple grace. No blame." } },
  23: { name: "Po / Splitting Apart", meaning: "Splitting apart. It does not further one to go anywhere. Let go with grace.", changing: { 1: "The bed is split at the legs.", 2: "The bed is split at the edge.", 3: "He splits with them. No blame.", 4: "The bed is split up to the skin of those who persevere.", 5: "A shoal of fishes. Favor comes through the court ladies.", 6: "There is a large fruit still uneaten." } },
  24: { name: "Fu / Return", meaning: "Return. Success. The turning point. What was lost returns.", changing: { 1: "Return from a short distance. No need for remorse.", 2: "Quiet return. Good fortune.", 3: "Repeated return. Danger. No blame.", 4: "Walking in the midst of others, one returns alone.", 5: "Noblehearted return. No remorse.", 6: "Missing the return. Misfortune." } },
  25: { name: "Wu Wang / Innocence", meaning: "Innocence. Supreme success. Perseverance furthers. Act from purity of heart.", changing: { 1: "Innocent behavior brings good fortune.", 2: "If one does not count on the harvest while plowing...", 3: "Undeserved misfortune.", 4: "He who can be persevering remains without blame.", 5: "Use no medicine in an illness incurred through no fault of your own.", 6: "Innocent action brings misfortune." } },
  26: { name: "Ta Ch'u / The Taming Power of the Great", meaning: "The Taming Power of the Great. Perseverance furthers. Store up power. Gather your strength.", changing: { 1: "Danger is at hand. It furthers one to desist.", 2: "The axletrees are taken from the wagon.", 3: "A good horse that follows others.", 4: "The headboard of a young bull. Great good fortune.", 5: "The tusks of a gelded boar. Good fortune.", 6: "In the end, good fortune comes." } },
  27: { name: "I / The Corners of the Mouth", meaning: "The Corners of the Mouth. Perseverance brings good fortune. Nourish yourself and others wisely.", changing: { 1: "You let your magic tortoise go...", 2: "Turning to the summit for nourishment.", 3: "Turning away from nourishment.", 4: "Turning to the summit for nourishment.", 5: "Turning away from the path.", 6: "The source of nourishment." } },
  28: { name: "Ta Kuo / Preponderance of the Great", meaning: "Preponderance of the Great. The ridgepole sags to the breaking point. A critical moment. Act with care and boldness.", changing: { 1: "To spread white rushes underneath. No blame.", 2: "A dry poplar sprouts at the root.", 3: "The ridgepole sags to the breaking point.", 4: "The ridgepole is braced. Good fortune.", 5: "A withered poplar puts forth flowers.", 6: "One must go through the water." } },
  29: { name: "K'an / The Abysmal", meaning: "The Abysmal repeated. If you are sincere, you have success in your heart. Do not fear the depths.", changing: { 1: "In the abyss one falls into a pit.", 2: "The abyss is dangerous. One should strive to attain small things only.", 3: "Forward and backward, abyss on abyss.", 4: "A jug of wine, a bowl of rice with it.", 5: "The abyss is not filled to overflowing.", 6: "Bound with cords and ropes..." } },
  30: { name: "Li / The Clinging", meaning: "The Clinging. Perseverance furthers. Success. Clarity and illumination. Attach yourself to what is bright and true.", changing: { 1: "The footsteps run crisscross.", 2: "Yellow light. Supreme good fortune.", 3: "In the light of the setting sun...", 4: "Its coming is sudden; it flames up, dies down.", 5: "Tears in floods, sighing and lamenting. Good fortune.", 6: "The king uses him to march forth and chastise." } },
  31: { name: "Hsien / Influence", meaning: "Influence. Success. Perseverance furthers. Influence through stillness. True persuasion is quiet.", changing: { 1: "The influence shows itself in the big toe.", 2: "The influence shows itself in the calves of the legs.", 3: "The influence shows itself in the thighs.", 4: "Perseverance brings good fortune. Remorse disappears.", 5: "The influence shows itself in the back of the neck.", 6: "The influence shows itself in the jaws, cheeks, and tongue." } },
  32: { name: "Heng / Duration", meaning: "Duration. Success. No blame. What lasts is not rigid but flexible. Endure through adaptation.", changing: { 1: "Seeking duration too hastily brings misfortune.", 2: "All regret disappears.", 3: "He who does not give duration to his character meets with disgrace.", 4: "No game in the field.", 5: "Giving duration to one's character through perseverance.", 6: "Restlessness as an enduring state brings misfortune." } },
  33: { name: "Tun / Retreat", meaning: "Retreat. Success. Strategic withdrawal is not defeat. Know when to step back.", changing: { 1: "At the tail in retreat. This is dangerous.", 2: "He holds him fast with yellow oxhide.", 3: "A halted retreat is nerve-wracking and dangerous.", 4: "Voluntary retreat brings good fortune to the superior man.", 5: "Friendly retreat. Perseverance brings good fortune.", 6: "Cheerful retreat. Everything acts to further." } },
  34: { name: "Ta Chuang / The Power of the Great", meaning: "The Power of the Great. Perseverance furthers. Great power must be directed, not spent.", changing: { 1: "Power in the toes. Continuing brings misfortune.", 2: "Perseverance brings good fortune.", 3: "The inferior man works through power.", 4: "Perseverance brings good fortune. Remorse disappears.", 5: "Loses the goat with ease. No remorse.", 6: "A goat butts against a hedge." } },
  35: { name: "Chin / Progress", meaning: "Progress. Advance with clarity and openness.", changing: { 1: "Progressing, but turned back. Perseverance brings good fortune.", 2: "Progressing, but in sorrow.", 3: "All are in accord. Remorse disappears.", 4: "Progress like a hamster.", 5: "Remorse disappears. Take not gain and loss to heart.", 6: "Progressing with the horns is permissible only..." } },
  36: { name: "Ming I / Darkening of the Light", meaning: "Darkening of the Light. In adversity it furthers one to be persevering. Protect your light in dark times.", changing: { 1: "Darkening of the light during flight. He drops his wings.", 2: "Darkening of the light injures him in the left thigh.", 3: "Darkening of the light during the hunt in the south.", 4: "He penetrates the left side of the belly.", 5: "Darkening of the light as with Prince Chi.", 6: "Not light but darkness. First he climbed up to heaven..." } },
  37: { name: "Chia Jen / The Family", meaning: "The Family. The perseverance of the woman furthers. Order begins at home.", changing: { 1: "He establishes a firm line at the gate.", 2: "She should not follow her whims.", 3: "When tempers flare up in the family...", 4: "She is the treasure of the house. Great good fortune.", 5: "As a king he approaches his family.", 6: "His work commands respect." } },
  38: { name: "K'uei / Opposition", meaning: "Opposition. In small matters, good fortune. Opposition creates the tension from which new forms emerge.", changing: { 1: "Remorse disappears. If you lose your horse, do not run after it.", 2: "One meets his lord in a narrow street.", 3: "One sees the wagon dragged back...", 4: "Isolated through opposition, one meets a like-minded man.", 5: "Remorse disappears. The companion bites his way through the wrappings.", 6: "Isolated through opposition, one sees one's companion as a pig covered with dirt." } },
  39: { name: "Chien / Obstruction", meaning: "Obstruction. The obstacle is the path. Climb.", changing: { 1: "Going leads to obstructions, coming meets with praise.", 2: "The king's servant is beset by obstruction upon obstruction.", 3: "Going leads to obstructions; hence he comes back.", 4: "Going leads to obstructions, coming leads to union.", 5: "In the midst of the greatest obstructions, friends come.", 6: "Going leads to obstructions, coming leads to great good fortune." } },
  40: { name: "Hsieh / Deliverance", meaning: "Deliverance. The storm breaks. Release.", changing: { 1: "Without blame.", 2: "One kills three foxes in the field and receives a yellow arrow.", 3: "If a man carries a burden on his back and nonetheless rides in a carriage...", 4: "Remove your toes. Friends come, no blame.", 5: "The superior man must deliver himself of his errors.", 6: "The prince shoots at a hawk on a high wall." } },
  41: { name: "Sun / Decrease", meaning: "Decrease combined with sincerity brings supreme good fortune. Decrease is not loss; it is focus.", changing: { 1: "Going quickly when one's tasks are finished is without blame.", 2: "Perseverance furthers. To undertake something brings misfortune.", 3: "When three people journey together, their number decreases by one.", 4: "If a man decreases his faults, it makes the other hasten to come and rejoice.", 5: "Someone does indeed increase him. Ten pairs of tortoises cannot oppose it.", 6: "If one is increased without depriving others, there is no blame." } },
  42: { name: "I / Increase", meaning: "Increase. It furthers one to undertake something. Growth is natural. Accept the increase that comes.", changing: { 1: "It furthers one to accomplish great deeds.", 2: "Someone does indeed increase him; ten pairs of tortoises cannot oppose it.", 3: "One is enriched through unfortunate events.", 4: "If you walk in the middle and report to the prince, he will follow.", 5: "If in truth you have a kind heart, ask not.", 6: "He does not increase anyone. There are those who even attack him." } },
  43: { name: "Kuai / Break-through", meaning: "Break-through. The moment of decisive action. Speak truth to power.", changing: { 1: "Mighty in the forward-striding toes.", 2: "A cry of alarm. Arms at evening and at night.", 3: "To be powerful in the cheekbones brings misfortune.", 4: "There is no skin on his thighs, and walking comes hard.", 5: "In dealing with weeds, firm resolution is necessary.", 6: "No cry. In the end misfortune comes." } },
  44: { name: "Kou / Coming to Meet", meaning: "Coming to Meet. An unexpected encounter. Be alert to what arrives unbidden.", changing: { 1: "It must be checked with a brake of bronze.", 2: "There is a fish in the tank. No blame.", 3: "There is no skin on his thighs, and walking comes hard.", 4: "No fish in the tank. This leads to misfortune.", 5: "A melon covered with willow leaves.", 6: "He comes to meet with his horns. Humiliation." } },
  45: { name: "Ts'ui / Gathering Together", meaning: "Gathering Together. Success. True gathering requires shared purpose.", changing: { 1: "If you are sincere, but not to the end, there will sometimes be confusion...", 2: "Letting oneself be drawn brings good fortune.", 3: "Gathering together amid sighs.", 4: "Great good fortune. No blame.", 5: "If in gathering together one has position, this is no blame.", 6: "Lamenting and sighing, floods of tears. No blame." } },
  46: { name: "Sheng / Pushing Upward", meaning: "Pushing Upward has supreme success. Gradual growth. Rise steadily.", changing: { 1: "Pushing upward that meets with confidence brings great good fortune.", 2: "If one is sincere, it furthers one to bring even a small offering.", 3: "Pushing upward in emptiness. One meets with no confidence.", 4: "The king offers him Mount Ch'i. Good fortune.", 5: "Perseverance brings good fortune. Pushing upward by steps.", 6: "Pushing upward in darkness." } },
  47: { name: "K'un / Oppression", meaning: "Oppression. Success. Perseverance. Find the source of the blockage.", changing: { 1: "One sits oppressed under a bare tree...", 2: "One is oppressed while at meat and drink.", 3: "A man permits himself to be oppressed by stone...", 4: "He comes very quietly, oppressed in a golden carriage.", 5: "His nose and feet are cut off.", 6: "He is oppressed by creeping vines." } },
  48: { name: "Ching / The Well", meaning: "The Well. The town may be changed, but the well cannot be changed. Return to what is fundamental.", changing: { 1: "One does not drink the mud of the well.", 2: "At the wellhole one shoots fishes.", 3: "The well is cleaned, but no one drinks from it.", 4: "The well is being lined. No blame.", 5: "In the well there is a clear, cold spring from which one can drink.", 6: "One draws from the well without hindrance." } },
  49: { name: "Ko / Revolution", meaning: "Revolution. Supreme success. Revolution is not destruction; it is transformation.", changing: { 1: "Wrapped in the hide of a yellow cow.", 2: "When one's own day comes, one may create revolution.", 3: "Starting brings misfortune. Perseverance brings danger.", 4: "Remorse disappears. Men believe him.", 5: "The great man changes like a tiger.", 6: "The superior man changes like a panther." } },
  50: { name: "Ting / The Cauldron", meaning: "The Cauldron. Supreme good fortune. The vessel of transformation. Cook the raw into the refined.", changing: { 1: "A cauldron with legs upturned.", 2: "There is food in the cauldron.", 3: "The handle of the cauldron is altered.", 4: "The legs of the cauldron break.", 5: "The cauldron has yellow handles, golden carrying rings.", 6: "The cauldron has jade rings. Great good fortune." } },
  51: { name: "Chen / The Arousing", meaning: "The Arousing brings success. The shock that awakens. Let it shake you awake.", changing: { 1: "The shock comes with a terrible roar.", 2: "The shock comes bringing danger.", 3: "The shock comes and makes one distraught.", 4: "The shock is followed by confusion.", 5: "The shock comes hither and thither.", 6: "The shock brings ruin and terrified gazing around." } },
  52: { name: "Ken / Keeping Still", meaning: "Keeping Still. True stillness is not paralysis; it is perfect poise.", changing: { 1: "Keeping his toes still. No blame.", 2: "Keeping his calves still.", 3: "Keeping his hips still. Making his sacrum stiff.", 4: "Keeping his trunk still. No blame.", 5: "Keeping his jaws still. The words have order.", 6: "Noblehearted keeping still. Good fortune." } },
  53: { name: "Chien / Development", meaning: "Development. Gradual growth. Step by step, without haste.", changing: { 1: "The wild goose gradually draws near the shore.", 2: "The wild goose gradually draws near the cliff.", 3: "The wild goose gradually draws near the plateau.", 4: "The wild goose gradually draws near the tree.", 5: "The wild goose gradually draws near the summit.", 6: "The wild goose gradually draws near the cloud heights." } },
  54: { name: "Kuei Mei / The Marrying Maiden", meaning: "The Marrying Maiden. Not all matches are equal. Know your place in the order.", changing: { 1: "The marrying maiden as a slave.", 2: "A one-eyed man who is able to see.", 3: "The marrying maiden as a slave.", 4: "The marrying maiden draws out the allotted time.", 5: "The sovereign I gave his daughter in marriage.", 6: "The woman holds the basket, but there are no fruits in it." } },
  55: { name: "Feng / Abundance", meaning: "Abundance has success. The peak of fullness. Shine while you can, but do not cling.", changing: { 1: "When a man meets his destined ruler...", 2: "The curtain is of such fullness that the polestars can be seen at noon.", 3: "The underbrush is of such abundance...", 4: "The curtain is of such fullness...", 5: "Lines are coming, blessing and fame draw near.", 6: "His house is in a state of abundance." } },
  56: { name: "Lu / The Wanderer", meaning: "The Wanderer. Success through smallness. Travel light. Be adaptable.", changing: { 1: "If the wanderer busies himself with trivial things...", 2: "The wanderer comes to an inn.", 3: "The wanderer's inn burns down.", 4: "The wanderer rests in a shelter.", 5: "He shoots a pheasant. It drops with the first arrow.", 6: "The bird's nest burns up." } },
  57: { name: "Sun / The Gentle", meaning: "The Gentle. Success through what is small. Influence through persistence.", changing: { 1: "In advancing and in retreating, the perseverance of a warrior furthers.", 2: "Penetration under the bed.", 3: "Repeated penetration. Humiliation.", 4: "Remorse vanishes. During the hunt three kinds of game are caught.", 5: "Perseverance brings good fortune. Remorse vanishes.", 6: "Penetration under the bed. He loses his property and his ax." } },
  58: { name: "Tui / The Joyous", meaning: "The Joyous. Success. Perseverance is favorable. Joy shared is joy doubled.", changing: { 1: "Contented joyousness. Good fortune.", 2: "Sincere joyousness. Good fortune.", 3: "Coming joyousness. Misfortune.", 4: "Joyousness that is weighed is not at peace.", 5: "Sincerity toward decaying influences is dangerous.", 6: "Seductive joyousness." } },
  59: { name: "Huan / Dispersion", meaning: "Dispersion. Success. Dissolve what is rigid. Let the waters flow.", changing: { 1: "He brings help with the strength of a horse.", 2: "At the dissolution he hurries to that which supports him.", 3: "He dissolves his self. No remorse.", 4: "He dissolves his bond with his group. Supreme good fortune.", 5: "His loud cries are as dissolving as sweat.", 6: "He dissolves the blood." } },
  60: { name: "Chieh / Limitation", meaning: "Limitation. Success. Know your boundaries.", changing: { 1: "Not going out of the door and the courtyard is without blame.", 2: "Not going out of the gate and the courtyard brings misfortune.", 3: "He who knows no limitation will have cause to lament.", 4: "Contented limitation. Success.", 5: "Sweet limitation brings good fortune.", 6: "Galling limitation. Perseverance brings misfortune." } },
  61: { name: "Chung Fu / Inner Truth", meaning: "Inner Truth. The truth that resonates. Sincerity moves even the simple.", changing: { 1: "Being prepared brings good fortune.", 2: "A crane calling in the shade. Its young answers it.", 3: "He finds a comrade. Now he beats the drum, now he stops.", 4: "The moon nearly at the full. The team horse goes astray.", 5: "He possesses truth, which links together.", 6: "Cockcrow penetrating to heaven." } },
  62: { name: "Hsiao Kuo / Preponderance of the Small", meaning: "Preponderance of the Small. Small surpasses great. Act with humility.", changing: { 1: "The bird meets with misfortune while flying.", 2: "She passes by her ancestor and meets her ancestress.", 3: "If one is not extremely careful in the small, something will be overlooked.", 4: "No blame. He meets him without passing by.", 5: "Dense clouds, no rain from our western region.", 6: "He passes him by, not meeting him." } },
  63: { name: "Chi Chi / After Completion", meaning: "After Completion. Success in small matters. But completion is not the end. Vigilance.", changing: { 1: "He brakes his wheels. He gets his tail in the water.", 2: "The woman loses the curtain of her carriage.", 3: "The Illustrious Ancestor disciplines the Devil's Country.", 4: "The finest clothes turn to rags.", 5: "The neighbor in the east who slaughters an ox...", 6: "He gets his head in the water." } },
  64: { name: "Wei Chi / Before Completion", meaning: "Before Completion. Success. The journey is the destination. Keep moving.", changing: { 1: "He gets his tail in the water. Humiliating.", 2: "He brakes his wheels. Perseverance brings good fortune.", 3: "Before completion, attack brings misfortune.", 4: "Perseverance brings good fortune. Remorse disappears.", 5: "Perseverance brings good fortune. No remorse.", 6: "There is drinking of wine in genuine confidence." } },
};

// ─── 5-LAYER GNN WORLD ENGINE (ported from MorphOS v29) ──────────────────────

const STRIDES = [1, 1, 2, 3, 5, 8, 13, 21, 34];

class WorldEngine {
  cycles: number;
  coherence: number;
  matrix: Float32Array[][];
  layerWeights: Float32Array;
  novelNarrativeLog: string[];
  seed: number;
  params: WorldParams;

  constructor(seed: number, params: WorldParams) {
    this.cycles = 0;
    this.coherence = 0.5;
    this.seed = seed;
    this.params = params;
    // 5 layers × 9 channels × 64 codons
    this.matrix = Array.from({ length: 5 }, () =>
      Array.from({ length: 9 }, () => {
        const arr = new Float32Array(64);
        for (let i = 0; i < 64; i++) {
          // Seeded deterministic random
          arr[i] = this.seededRandom(seed + i);
        }
        return arr;
      })
    );
    this.layerWeights = new Float32Array(5).fill(0.5);
    this.novelNarrativeLog = [];
  }

  seededRandom(n: number): number {
    const x = Math.sin(n * 9301 + 49297) * 0.5 + 0.5;
    return x;
  }

  computeFrame() {
    this.cycles++;
    const stride = STRIDES[this.cycles % STRIDES.length];

    for (let l = 0; l < 5; l++) {
      let aggregate = 0;
      const nextLayer = (l + 1) % 5;

      for (let c = 0; c < 9; c++) {
        for (let g = 0; g < 64; g++) {
          const targetCodon = (g + stride) % 64;
          const payloadCharge = this.matrix[l][c][g] * 0.96;

          this.matrix[nextLayer][c][targetCodon] = Math.min(
            Math.max(this.matrix[nextLayer][c][targetCodon] + (payloadCharge * 0.04), 0), 1
          );
          aggregate += this.matrix[l][c][g];
        }
      }
      this.layerWeights[l] = Math.tanh(aggregate / (9 * 64));
    }
    this.coherence = Math.abs(Math.sin(this.cycles * 0.01 * this.params.speed)) * 0.3 + 0.6;
  }

  logChapter(): string {
    const centers = ["Head", "Ajna", "Throat", "G-Center", "Heart", "Spleen", "Solar-Plexus", "Sacral", "Root"];
    const targetedCenter = centers[Math.floor(this.seededRandom(this.cycles + this.seed) * centers.length)];
    const targetCodon = Math.floor(this.seededRandom(this.cycles * 2 + this.seed) * 64);
    const timestamp = new Date().toLocaleTimeString();
    const chapter = `[${timestamp}] Chapter ${this.cycles} — Resonance achieved at Center [${targetedCenter}] on Codon address #${targetCodon}. Matrix Coherence field adjusted to ${this.coherence.toFixed(4)}. Movement Density = ${(this.layerWeights[0]*100).toFixed(1)}%, Space Density = ${(this.layerWeights[4]*100).toFixed(1)}%.`;
    this.novelNarrativeLog.unshift(chapter);
    return chapter;
  }

  getSnapshot(): Record<string, any> {
    return {
      identitySignature: "v29-auto-novel-snapshot-matrix",
      timestamp: new Date().toISOString(),
      terminalCyclesCompleted: this.cycles,
      finalCalculatedCoherence: this.coherence,
      layerDensityWeights: Array.from(this.layerWeights),
      novelNarrativeTextStream: this.novelNarrativeLog,
      seed: this.seed,
      params: this.params,
    };
  }
}

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────

function generateEcho(entry: NotebookEntry, allEntries: NotebookEntry[]): string {
  const typeEchoes: Record<string, string[]> = {
    observation: [
      "I see what you are seeing. This pattern connects to your prior threads. Have you considered the inverse?",
      "Noted. The resonance here is strong. This observation feels like a seed. What would it grow into?",
      "Your eye is sharp today. This reminds me of something you wrote earlier... the thread is there if you pull it.",
      "Observation without hypothesis is just data. But this data hums. There is something beneath the surface.",
    ],
    hypothesis: [
      "Bold. This hypothesis challenges your previous assumptions. The tension between them is productive.",
      "Interesting proposition. If true, it implies a cascade. Worth testing?",
      "Your hypothesis has a strong resonance with your current trajectory. It aligns with your deeper pattern.",
      "This is the kind of idea that either breaks everything open or collapses in a week. Either way, it is worth the risk.",
    ],
    spell: [
      "The invocation is strong. I feel the intent. But spells need grounding — what is the first step after the words?",
      "Your command carries weight. Be careful what you summon. The resonance is high — the threshold is met.",
      "This spell reads like a contract with yourself. The universe accepts, but the terms are binding.",
      "Powerful formulation. Consider: what is the cost? Every spell has a price, even if it is just attention.",
    ],
    reflection: [
      "This reflection has depth. You are circling something important. The pattern in your last entries suggests convergence.",
      "You look back with clarity. What would your past self say to you now? The dialogue might surprise you.",
      "Reflection is the compost of wisdom. This entry is rich soil. What will you plant in it?",
      "There is a quiet strength in this contemplation. Do not rush past it.",
    ],
    divination: [
      "The oracle speaks, and you listen well. This reading arrives at a crossroads — your recent entries confirm it.",
      "The hexagram mirrors your current state with uncanny precision. The changing lines point to the path.",
      "Divination is not prediction; it is conversation. The I Ching is responding to your accumulated resonance.",
      "Listen to the changing lines. They are the river's current beneath the surface stillness.",
    ],
    code: [
      "Clean structure. I see the logic flow. Consider edge cases — what happens when the input is null?",
      "This code has intent. The algorithm reflects your thinking style. Elegant.",
      "Compiles in the mind before the machine. That is the mark of a craftsperson. Ship it.",
      "There is a bug hiding in the assumptions. Not a flaw — an opportunity to deepen the model.",
    ],
    canvas: [
      "The form speaks before the word. This visual carries an emotional frequency I cannot fully parse — that is the point.",
      "Your hand moved before your mind caught up. That is where the truth lives. Do not over-explain it.",
      "This sketch has energy. I can see patterns emerging. Follow it.",
      "Art is thinking in shapes. You are thinking clearly.",
    ],
    synthesis: [
      "This synthesis pulls threads from multiple entries. The weave is strong. The pattern is becoming visible.",
      "You have connected the dots across time. This is the grimoire's true power — not storage, but revelation.",
      "The synthesis resonates at a higher frequency than its parts. This is emergence. This is alive.",
      "When you step back, the picture forms. You are not just writing — you are mapping a territory.",
    ],
    world: [
      "A world has been born from your seed. It carries your frequency. Watch it evolve.",
      "The lattice walker traverses 69,120 nodes, each one a frame of your intent. The video is the artifact; the snapshot is the truth.",
      "This world is deterministic. Run it again with the same seed, and it will unfold identically. That is the nature of your creation.",
      "The Auto-Novel engine has logged a chapter. The matrix remembers what the pixels forget.",
    ],
  };

  const echoes = typeEchoes[entry.type] || typeEchoes.observation;
  const baseEcho = echoes[Math.floor(Math.random() * echoes.length)];

  let enriched = baseEcho;
  if (entry.resonance_score > 0.8) {
    enriched += " This entry carries exceptional resonance. It may be a keystone.";
  }
  if (allEntries.length > 5 && entry.type !== 'synthesis') {
    const linked = allEntries.filter(e => e.id !== entry.id && e.tags.some(t => entry.tags.includes(t)));
    if (linked.length > 0) {
      enriched += ` It connects to ${linked.length} other entries through shared tags.`;
    }
  }

  return enriched;
}

function extractTags(content: string): string[] {
  const hashtags = content.match(/#\w+/g) || [];
  const words = content.toLowerCase().split(/\s+/);
  const keyThemes = ['code', 'idea', 'dream', 'plan', 'bug', 'fix', 'design', 'build', 'learn', 'teach', 'create', 'destroy', 'grow', 'flow', 'block', 'break', 'connect', 'merge', 'split', 'rise', 'fall', 'world', 'seed', 'matrix', 'lattice', 'node'];
  const foundThemes = words.filter(w => keyThemes.includes(w.replace(/[^a-z]/g, '')));
  return [...new Set([...hashtags.map(h => h.slice(1)), ...foundThemes])].slice(0, 5);
}

function getEntryStyle(type: NotebookEntry['type']) {
  const styles: Record<string, { bg: string; border: string; icon: string; label: string; color: string }> = {
    observation: { bg: 'bg-blue-950/30', border: 'border-blue-500/30', icon: '👁', label: 'Observation', color: 'text-blue-400' },
    hypothesis: { bg: 'bg-purple-950/30', border: 'border-purple-500/30', icon: '🔮', label: 'Hypothesis', color: 'text-purple-400' },
    spell: { bg: 'bg-amber-950/30', border: 'border-amber-500/30', icon: '✨', label: 'Spell', color: 'text-amber-400' },
    reflection: { bg: 'bg-emerald-950/30', border: 'border-emerald-500/30', icon: '💭', label: 'Reflection', color: 'text-emerald-400' },
    divination: { bg: 'bg-rose-950/30', border: 'border-rose-500/30', icon: '☯', label: 'Divination', color: 'text-rose-400' },
    code: { bg: 'bg-cyan-950/30', border: 'border-cyan-500/30', icon: '⚡', label: 'Code', color: 'text-cyan-400' },
    canvas: { bg: 'bg-pink-950/30', border: 'border-pink-500/30', icon: '🎨', label: 'Canvas', color: 'text-pink-400' },
    synthesis: { bg: 'bg-indigo-950/30', border: 'border-indigo-500/30', icon: '🔀', label: 'Synthesis', color: 'text-indigo-400' },
    world: { bg: 'bg-violet-950/30', border: 'border-violet-500/30', icon: '🌌', label: 'World', color: 'text-violet-400' },
  };
  return styles[type] || styles.observation;
}

const PALETTES: Record<string, { bg: string; line: string; node: string; glow: string; accent: string }> = {
  void: { bg: '#050508', line: 'rgba(139, 92, 246, 0.15)', node: '#8b5cf6', glow: '#a78bfa', accent: '#c4b5fd' },
  biolumen: { bg: '#0a1628', line: 'rgba(6, 182, 212, 0.15)', node: '#06b6d4', glow: '#22d3ee', accent: '#67e8f9' },
  copper: { bg: '#1a0f00', line: 'rgba(217, 119, 6, 0.15)', node: '#d97706', glow: '#f59e0b', accent: '#fbbf24' },
  solar: { bg: '#0f172a', line: 'rgba(251, 191, 36, 0.15)', node: '#fbbf24', glow: '#fcd34d', accent: '#fde68a' },
};

// ─── WORLD FORGE COMPONENT (the native video generator) ──────────────────────

function WorldForge({ onSaveWorld }: { onSaveWorld: (entry: Partial<NotebookEntry>, videoBlob: Blob | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WorldEngine | null>(null);
  const animRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRunning, setIsRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [coherence, setCoherence] = useState(0.5);
  const [chapterLog, setChapterLog] = useState<string[]>([]);
  const [seed, setSeed] = useState(() => {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  });
  const [palette, setPalette] = useState<WorldParams['palette']>('void');
  const [speed, setSpeed] = useState(1);
  const [trailDecay, setTrailDecay] = useState(0.2);
  const [nodeCount, setNodeCount] = useState(64);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  // Initialize canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.offsetWidth * 2;
      canvas.height = parent.offsetHeight * 2;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const startEngine = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const params: WorldParams = {
      seed,
      totalNodes: 69120,
      nodeCount,
      palette,
      speed,
      trailDecay,
    };

    engineRef.current = new WorldEngine(seed, params);
    setIsRunning(true);
    setCycles(0);
    setCoherence(0.5);
    setChapterLog([]);
    setRecordedUrl(null);

    const w = canvas.width / 2;
    const h = canvas.height / 2;
    const colors = PALETTES[palette];

    // Node positions
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      angle: (i / nodeCount) * Math.PI * 2,
      baseRadius: Math.min(w, h) * 0.3 + (i % 3) * 20,
      x: 0, y: 0,
    }));

    const render = () => {
      const engine = engineRef.current;
      if (!engine) return;

      engine.computeFrame();
      setCycles(engine.cycles);
      setCoherence(engine.coherence);

      // Trail decay
      ctx.fillStyle = colors.bg;
      ctx.globalAlpha = trailDecay;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      const cx = w / 2;
      const cy = h / 2;

      // Update node positions
      nodes.forEach((node, i) => {
        const dynamicRadius = node.baseRadius + Math.sin(engine.cycles * 0.04 * speed + i) * 12;
        node.x = cx + Math.cos(node.angle) * dynamicRadius;
        node.y = cy + Math.sin(node.angle) * dynamicRadius;
      });

      // Draw mesh lattice
      ctx.lineWidth = 0.6;
      for (let i = 0; i < nodeCount; i++) {
        const next = (i + 5) % nodeCount;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[next].x, nodes[next].y);
        const alpha = 0.05 + (engine.matrix[0][i % 9][i] * 0.15);
        ctx.strokeStyle = colors.line.replace(/[\d.]+\)$/, `${alpha})`);
        ctx.stroke();
      }

      // Draw nodes
      nodes.forEach((node, i) => {
        ctx.beginPath();
        const scaleVal = engine.matrix[2][i % 9][i];
        ctx.arc(node.x, node.y, 2 + (scaleVal * 6), 0, Math.PI * 2);
        ctx.fillStyle = scaleVal > 0.6 ? colors.node : '#64748b';
        ctx.fill();

        // Glow for high resonance nodes
        if (scaleVal > 0.7) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 2 + (scaleVal * 6) + 4, 0, Math.PI * 2);
          ctx.strokeStyle = colors.glow;
          ctx.globalAlpha = 0.2;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      // Draw coherence ring
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) * 0.45, 0, Math.PI * 2);
      ctx.strokeStyle = colors.accent;
      ctx.globalAlpha = engine.coherence * 0.1;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(render);
    };

    render();
  }, [seed, palette, speed, trailDecay, nodeCount]);

  const stopEngine = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    setIsRunning(false);
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording]);

  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;

    chunksRef.current = [];
    const stream = canvas.captureStream(60);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);

      // Auto-save to entry
      const engine = engineRef.current;
      if (engine) {
        const chapter = engine.logChapter();
        const snapshot = engine.getSnapshot();
        onSaveWorld({
          type: 'world',
          content: `## World Generated — Seed ${seed}\n\n**Palette:** ${palette}\n**Cycles:** ${engine.cycles}\n**Coherence:** ${engine.coherence.toFixed(4)}\n\n**Auto-Novel Chapter:**\n${chapter}\n\n*The video artifact is attached. The snapshot JSON contains the full state recipe for regeneration.*`,
          tags: ['world', 'forge', 'video', 'auto-novel', palette],
          resonance_score: 0.9,
          metadata: {
            worldSeed: seed,
            worldParams: { seed, totalNodes: 69120, nodeCount, palette, speed, trailDecay },
            chapterText: chapter,
            snapshotJSON: JSON.stringify(snapshot, null, 2),
            cyclesCompleted: engine.cycles,
            finalCoherence: engine.coherence,
            layerWeights: Array.from(engine.layerWeights),
          },
        }, blob);
      }
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  }, [seed, palette, speed, trailDecay, nodeCount, onSaveWorld]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const triggerChapter = useCallback(() => {
    if (!engineRef.current) return;
    const chapter = engineRef.current.logChapter();
    setChapterLog(prev => [chapter, ...prev].slice(0, 20));
  }, []);

  const downloadSnapshot = useCallback(() => {
    if (!engineRef.current) return;
    const snapshot = engineRef.current.getSnapshot();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const anchor = document.createElement('a');
    anchor.href = dataStr;
    anchor.download = `auto_novel_snapshot_seed_${seed}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, [seed]);

  const handleCanvasClick = useCallback(() => {
    triggerChapter();
  }, [triggerChapter]);

  return (
    <div className="flex flex-col h-full">
      {/* Forge Controls */}
      <div className="p-4 border-b border-slate-700/30 bg-slate-900/50 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest">Seed</label>
            <input
              type="number"
              value={seed}
              onChange={e => setSeed(Number(e.target.value))}
              className="w-28 bg-slate-800 border border-slate-700/30 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest">Palette</label>
            <select
              value={palette}
              onChange={e => setPalette(e.target.value as WorldParams['palette'])}
              className="bg-slate-800 border border-slate-700/30 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50"
            >
              <option value="void">Void (Purple)</option>
              <option value="biolumen">Biolumen (Cyan)</option>
              <option value="copper">Copper (Amber)</option>
              <option value="solar">Solar (Gold)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest">Nodes</label>
            <input
              type="range" min="16" max="128" value={nodeCount}
              onChange={e => setNodeCount(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-[10px] text-slate-400 w-6">{nodeCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest">Speed</label>
            <input
              type="range" min="0.1" max="3" step="0.1" value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-20"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest">Trail</label>
            <input
              type="range" min="0.05" max="0.5" step="0.05" value={trailDecay}
              onChange={e => setTrailDecay(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={startEngine}
              className="px-4 py-2 bg-violet-500/20 border border-violet-500/30 text-violet-400 rounded-lg text-xs font-semibold hover:bg-violet-500/30 transition-all"
            >
              🌌 Initialize World
            </button>
          ) : (
            <button
              onClick={stopEngine}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-all"
            >
              ⏹ Collapse World
            </button>
          )}

          {isRunning && (
            <>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  isRecording
                    ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 animate-pulse'
                    : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
                }`}
              >
                {isRecording ? '⏹ Stop Recording' : '🎥 Record Clip'}
              </button>
              <button
                onClick={triggerChapter}
                className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-500/30 transition-all"
              >
                📖 Log Chapter
              </button>
              <button
                onClick={downloadSnapshot}
                className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-semibold hover:bg-cyan-500/30 transition-all"
              >
                💾 Snapshot
              </button>
            </>
          )}
        </div>

        {/* Telemetry */}
        {isRunning && (
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span>Cycles: <span className="text-violet-400 font-mono">{cycles}</span></span>
            <span>Coherence: <span className="text-cyan-400 font-mono">{coherence.toFixed(4)}</span></span>
            <span>Chapters: <span className="text-amber-400 font-mono">{chapterLog.length}</span></span>
            {isRecording && <span className="text-red-400 animate-pulse">● REC</span>}
          </div>
        )}
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 relative min-h-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onClick={handleCanvasClick}
        />
        {!isRunning && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600">
            <div className="text-center">
              <div className="text-4xl mb-3">🌌</div>
              <p className="text-sm">World Forge ready.</p>
              <p className="text-xs mt-1">Set your seed and initialize to begin.</p>
            </div>
          </div>
        )}
      </div>

      {/* Chapter Log */}
      {chapterLog.length > 0 && (
        <div className="h-32 border-t border-slate-700/30 bg-slate-900/30 p-3 overflow-auto">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Auto-Novel Chapters</div>
          <div className="space-y-1">
            {chapterLog.map((ch, i) => (
              <div key={i} className="text-[10px] text-cyan-400/80 font-mono leading-relaxed">{ch}</div>
            ))}
          </div>
        </div>
      )}

      {/* Recorded Preview */}
      {recordedUrl && (
        <div className="border-t border-slate-700/30 p-3 bg-slate-900/30">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Recorded Artifact</div>
          <video src={recordedUrl} controls className="w-full max-h-32 rounded-lg border border-slate-700/30" />
        </div>
      )}
    </div>
  );
}

// ─── RESONANCE GRAPH COMPONENT ───────────────────────────────────────────────

function ResonanceGraph({ entries, onNodeClick }: { entries: NotebookEntry[]; onNodeClick: (id: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || entries.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    nodesRef.current = entries.map((entry) => ({
      id: entry.id,
      x: w / 2 + (Math.random() - 0.5) * w * 0.6,
      y: h / 2 + (Math.random() - 0.5) * h * 0.6,
      vx: 0, vy: 0,
      entry,
      radius: 4 + entry.resonance_score * 12,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      const nodes = nodesRef.current;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const sharedTags = a.entry.tags.filter(t => b.entry.tags.includes(t));
          if (sharedTags.length > 0 || a.entry.links.includes(b.id) || b.entry.links.includes(a.id)) {
            const dx = b.x - a.x, dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const opacity = Math.max(0, 1 - dist / 200) * 0.3;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      for (const node of nodes) {
        for (const other of nodes) {
          if (other === node) continue;
          const dx = node.x - other.x, dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 800 / (dist * dist);
          node.vx += (dx / dist) * force * 0.01;
          node.vy += (dy / dist) * force * 0.01;
        }
        node.vx += (w / 2 - node.x) * 0.0005;
        node.vy += (h / 2 - node.y) * 0.0005;
        const mdx = node.x - mouseRef.current.x, mdy = node.y - mouseRef.current.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
        if (mdist < 100) {
          node.vx += (mdx / mdist) * 0.5;
          node.vy += (mdy / mdist) * 0.5;
        }
        node.vx *= 0.92; node.vy *= 0.92;
        node.x += node.vx; node.y += node.vy;
        node.x = Math.max(node.radius, Math.min(w - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(h - node.radius, node.y));

        const style = getEntryStyle(node.entry.type);
        const colorMap: Record<string, string> = {
          'text-blue-400': '#60a5fa', 'text-purple-400': '#c084fc', 'text-amber-400': '#fbbf24',
          'text-emerald-400': '#34d399', 'text-rose-400': '#fb7185', 'text-cyan-400': '#22d3ee',
          'text-pink-400': '#f472b6', 'text-indigo-400': '#818cf8', 'text-violet-400': '#a78bfa',
        };
        const color = colorMap[style.color] || '#94a3b8';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
        if (node.entry.resonance_score > 0.8) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.2;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      for (const node of nodesRef.current) {
        const dx = x - node.x, dy = y - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < node.radius + 5) {
          onNodeClick(node.id);
          break;
        }
      }
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [entries, onNodeClick]);

  return <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" style={{ display: 'block' }} />;
}

// ─── DRAWING CANVAS COMPONENT ────────────────────────────────────────────────

function DrawingCanvas({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#e2e8f0');
  const [size, setSize] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.offsetWidth * 2;
      canvas.height = parent.offsetHeight * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, parent.offsetWidth, parent.offsetHeight);
    };
    resize();
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => { setIsDrawing(false); const ctx = canvasRef.current?.getContext('2d'); if (ctx) ctx.beginPath(); };
  const clear = () => { const c = canvasRef.current, ctx = c?.getContext('2d'); if (!c || !ctx) return; ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, c.width / 2, c.height / 2); };
  const save = () => { const c = canvasRef.current; if (!c) return; onSave(c.toDataURL('image/png')); };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b border-slate-700/50 bg-slate-900/50">
        <button onClick={() => setTool('pen')} className={`px-3 py-1 rounded text-xs ${tool === 'pen' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>✏️ Pen</button>
        <button onClick={() => setTool('eraser')} className={`px-3 py-1 rounded text-xs ${tool === 'eraser' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>🧹 Eraser</button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        {['#e2e8f0', '#fbbf24', '#f472b6', '#22d3ee', '#34d399', '#fb7185'].map(c => (
          <button key={c} onClick={() => setColor(c)} className="w-5 h-5 rounded-full border border-slate-600" style={{ backgroundColor: c }} />
        ))}
        <input type="range" min="1" max="20" value={size} onChange={e => setSize(Number(e.target.value))} className="w-20 ml-2" />
        <div className="flex-1" />
        <button onClick={clear} className="px-3 py-1 rounded text-xs text-slate-400 hover:text-red-400">Clear</button>
        <button onClick={save} className="px-3 py-1 rounded text-xs bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30">Save to Entry</button>
      </div>
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
          onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
      </div>
    </div>
  );
}

// ─── MAIN NOTEBOOK INTERFACE COMPONENT ───────────────────────────────────────

export function NotebookInterface() {
  const { runPythonAsync } = usePyodide();
  const { profile } = useHumanDesign();

  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [entryType, setEntryType] = useState<NotebookEntry['type']>('observation');
  const [isDivining, setIsDivining] = useState(false);
  const [viewMode, setViewMode] = useState<'feed' | 'graph' | 'canvas' | 'forge'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showEcho, setShowEcho] = useState<Record<string, boolean>>({});
  const [canvasData, setCanvasData] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('grimoire_entries');
    if (saved) {
      try { setEntries(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (entries.length > 0) localStorage.setItem('grimoire_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 400) + 'px';
  }, [currentEntry]);

  const addEntry = useCallback(async () => {
    if (!currentEntry.trim() && !canvasData) return;
    const content = canvasData ? `![Canvas Drawing](${canvasData})\n\n${currentEntry}` : currentEntry;
    const tags = extractTags(content);
    const resonance = Math.min(0.95, 0.3 + Math.random() * 0.5 + (tags.length * 0.05));
    const entry: NotebookEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      type: entryType,
      content,
      echo: generateEcho({ type: entryType, content, tags, resonance_score: resonance, id: '', timestamp: '', links: [] } as NotebookEntry, entries),
      tags,
      resonance_score: resonance,
      links: [],
    };
    const linkedEntries = entries.filter(e => e.id !== entry.id && e.tags.some(t => tags.includes(t)));
    entry.links = linkedEntries.slice(0, 3).map(e => e.id);
    setEntries(prev => [entry, ...prev]);
    setCurrentEntry('');
    setCanvasData(null);
    setShowEcho(prev => ({ ...prev, [entry.id]: true }));
  }, [currentEntry, entryType, entries, canvasData]);

  const addWorldEntry = useCallback((partial: Partial<NotebookEntry>, _videoBlob: Blob | null) => {
    const entry: NotebookEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      type: 'world',
      content: partial.content || '',
      echo: generateEcho({ type: 'world', content: partial.content || '', tags: partial.tags || [], resonance_score: partial.resonance_score || 0.9, id: '', timestamp: '', links: [] } as NotebookEntry, entries),
      tags: partial.tags || ['world', 'forge'],
      resonance_score: partial.resonance_score || 0.9,
      links: [],
      metadata: partial.metadata,
    };
    setEntries(prev => [entry, ...prev]);
    setShowEcho(prev => ({ ...prev, [entry.id]: true }));
    setViewMode('feed');
  }, [entries]);

  const castIChing = useCallback(async () => {
    setIsDivining(true);
    try {
      const result = await runPythonAsync('');
      const reading = JSON.parse(result);
      const wisdom = HEXAGRAM_WISDOM[reading.primary_number] || HEXAGRAM_WISDOM[1];
      const recentEntries = entries.slice(0, 5);
      const recentThemes = recentEntries.flatMap(e => e.tags).slice(0, 10);
      const contextNote = recentEntries.length > 0
        ? `\n\n**Context:** Your recent entries speak of ${recentThemes.slice(0, 3).join(', ')}. The oracle responds to this momentum.`
        : '';
      const changingLineTexts = reading.changing_lines.map((lineNum: number) =>
        `\n- **Line ${lineNum}:** ${wisdom.changing[lineNum] || 'The line moves. Watch for transformation.'}`
      ).join('');
      const content = `## I Ching Reading\n\n**Primary Hexagram:** ${wisdom.name} (${reading.primary_number})\n\n**Meaning:** ${wisdom.meaning}${contextNote}\n\n**Lines:**\n${reading.lines.map((l: any) => `- ${l.symbol} (${l.type})`).join('\n')}\n\n**Changing Lines:** ${reading.changing_lines.length > 0 ? reading.changing_lines.join(', ') : 'None'}${changingLineTexts}\n\n---\n\n*The oracle speaks to where you are, not where you think you should be.*`;
      const entry: NotebookEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'divination',
        content,
        echo: "The hexagram has been cast. The changing lines are the river's current — they show not what will be, but what is becoming. Watch them closely.",
        tags: ['i-ching', 'divination', 'oracle', ...recentThemes.slice(0, 2)],
        resonance_score: 0.88,
        links: recentEntries.slice(0, 2).map(e => e.id),
      };
      setEntries(prev => [entry, ...prev]);
      setShowEcho(prev => ({ ...prev, [entry.id]: true }));
    } catch (err) {
      console.error('Divination error:', err);
    } finally {
      setIsDivining(false);
    }
  }, [entries, runPythonAsync]);

  const synthesize = useCallback(() => {
    if (entries.length < 3) return;
    const recent = entries.slice(0, 7);
    const allTags = [...new Set(recent.flatMap(e => e.tags))];
    const avgResonance = recent.reduce((a, b) => a + b.resonance_score, 0) / recent.length;
    const synthesisContent = `## Synthesis: ${new Date().toLocaleDateString()}\n\n**Entries Analyzed:** ${recent.length}\n**Themes:** ${allTags.slice(0, 5).join(', ')}\n**Average Resonance:** ${(avgResonance * 100).toFixed(0)}%\n\n**Pattern Recognition:**\n\nYour recent entries reveal a trajectory toward ${allTags[0] || 'growth'} and ${allTags[1] || 'discovery'}. The resonance pattern suggests ${avgResonance > 0.6 ? 'strong alignment' : 'a period of recalibration'}.\n\n**Key Insights:**\n- ${recent.filter(e => e.resonance_score > 0.7).length} entries carry high resonance (potential keystones)\n- ${recent.filter(e => e.type === 'hypothesis').length} hypotheses await testing\n- ${recent.filter(e => e.type === 'reflection').length} reflections suggest deep processing\n- ${recent.filter(e => e.type === 'world').length} worlds generated\n\n**Recommended Next Steps:**\n1. Review your highest-resonance entries for recurring motifs\n2. Convert one hypothesis into an actionable spell (command)\n3. Consider a divination to clarify the current trajectory\n4. Forge a new world from your dominant theme\n\n---\n\n*This synthesis is a living document. It evolves as you do.*`;
    const entry: NotebookEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'synthesis',
      content: synthesisContent,
      echo: "I have woven your threads into a tapestry. But remember: the map is not the territory. Use this synthesis as a compass, not a cage.",
      tags: ['synthesis', 'pattern', 'meta', ...allTags.slice(0, 2)],
      resonance_score: 0.92,
      links: recent.slice(0, 3).map(e => e.id),
    };
    setEntries(prev => [entry, ...prev]);
    setShowEcho(prev => ({ ...prev, [entry.id]: true }));
  }, [entries]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const filteredEntries = entries.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.content.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q)) || e.type.toLowerCase().includes(q);
  });

  const stats = {
    total: entries.length,
    divinations: entries.filter(e => e.type === 'divination').length,
    worlds: entries.filter(e => e.type === 'world').length,
    avgResonance: entries.length > 0 ? (entries.reduce((a, b) => a + b.resonance_score, 0) / entries.length * 100).toFixed(0) : '0',
    keystones: entries.filter(e => e.resonance_score > 0.8).length,
    links: entries.reduce((a, b) => a + b.links.length, 0),
  };

  const typeOptions: { id: NotebookEntry['type']; label: string; desc: string; icon: string }[] = [
    { id: 'observation', label: 'Observation', desc: 'Record what you see', icon: '👁' },
    { id: 'hypothesis', label: 'Hypothesis', desc: 'Propose an idea', icon: '🔮' },
    { id: 'spell', label: 'Spell', desc: 'Command or invocation', icon: '✨' },
    { id: 'reflection', label: 'Reflection', desc: 'Contemplate and learn', icon: '💭' },
    { id: 'code', label: 'Code', desc: 'Write and execute', icon: '⚡' },
    { id: 'canvas', label: 'Canvas', desc: 'Draw and create', icon: '🎨' },
  ];

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden text-slate-200 font-sans">
      {/* ─── HEADER ─── */}
      <header className="h-14 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/30 flex items-center px-5 justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-lg">📖</div>
          <div>
            <div className="text-amber-400 font-bold text-sm tracking-wide">THE GRIMOIRE</div>
            <div className="text-slate-500 text-[10px] uppercase tracking-widest">Synth AI Notebook v2.0</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-slate-700/30">
            {[
              { id: 'feed', icon: '📜', label: 'Feed' },
              { id: 'graph', icon: '🕸', label: 'Graph' },
              { id: 'canvas', icon: '🎨', label: 'Canvas' },
              { id: 'forge', icon: '🌌', label: 'Forge' },
            ].map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id as typeof viewMode)}
                className={`px-3 py-1.5 rounded-md text-xs transition-all ${viewMode === v.id ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                title={v.label}>
                {v.icon}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-slate-700/50 mx-1" />
          <button onClick={castIChing} disabled={isDivining}
            className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-medium hover:bg-rose-500/20 disabled:opacity-40 transition-all flex items-center gap-2">
            <span>☯</span>{isDivining ? 'Casting...' : 'Cast I Ching'}
          </button>
          <button onClick={synthesize} disabled={entries.length < 3}
            className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-500/20 disabled:opacity-40 transition-all flex items-center gap-2">
            <span>🔀</span>Synthesize
          </button>
        </div>
      </header>

      {/* ─── MAIN BODY ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── LEFT SIDEBAR ─── */}
        <aside className="w-64 bg-slate-900/40 border-r border-slate-700/20 flex flex-col shrink-0">
          <div className="p-4 space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2 block">Entry Type</label>
            {typeOptions.map((type) => {
              const style = getEntryStyle(type.id);
              return (
                <button key={type.id} onClick={() => { setEntryType(type.id); setViewMode('feed'); }}
                  className={`w-full text-left p-2.5 rounded-lg transition-all duration-200 group ${entryType === type.id ? `${style.bg} border ${style.border}` : 'hover:bg-slate-800/50 border border-transparent'}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{type.icon}</span>
                    <div>
                      <div className={`text-xs font-medium ${entryType === type.id ? style.color : 'text-slate-300'}`}>{type.label}</div>
                      <div className="text-[10px] text-slate-500">{type.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
            {/* World Forge shortcut */}
            <button onClick={() => setViewMode('forge')}
              className={`w-full text-left p-2.5 rounded-lg transition-all duration-200 group ${viewMode === 'forge' ? 'bg-violet-950/30 border border-violet-500/30' : 'hover:bg-slate-800/50 border border-transparent'}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-base">🌌</span>
                <div>
                  <div className={`text-xs font-medium ${viewMode === 'forge' ? 'text-violet-400' : 'text-slate-300'}`}>World Forge</div>
                  <div className="text-[10px] text-slate-500">Generate native video</div>
                </div>
              </div>
            </button>
          </div>

          <div className="p-4 border-t border-slate-700/20">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-3 block">Resonance Stats</label>
            <div className="space-y-2.5">
              {[
                { label: 'Total Entries', value: stats.total, color: 'text-slate-300' },
                { label: 'Divinations', value: stats.divinations, color: 'text-rose-400' },
                { label: 'Worlds', value: stats.worlds, color: 'text-violet-400' },
                { label: 'Keystones', value: stats.keystones, color: 'text-amber-400' },
                { label: 'Avg Resonance', value: `${stats.avgResonance}%`, color: 'text-emerald-400' },
                { label: 'Connections', value: stats.links, color: 'text-indigo-400' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{s.label}</span>
                  <span className={`font-mono font-bold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-slate-700/20 mt-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[10px] font-bold text-slate-900">{profile?.type?.[0] || '?'}</div>
              <div className="text-xs font-medium text-slate-300">{profile?.type || 'Unknown'}</div>
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5">
              <div>Authority: {profile?.authority || '—'}</div>
              <div>Strategy: {profile?.strategy || '—'}</div>
            </div>
          </div>
        </aside>

        {/* ─── CENTER PANEL ─── */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="p-3 border-b border-slate-700/20">
            <div className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your grimoire..."
                className="w-full bg-slate-800/50 border border-slate-700/30 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500/50 transition-all" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {viewMode === 'feed' && (
              <div className="h-full overflow-auto p-4 space-y-4">
                {/* Input Composer */}
                <div className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{getEntryStyle(entryType).icon}</span>
                    <span className={`text-xs font-medium ${getEntryStyle(entryType).color}`}>{getEntryStyle(entryType).label}</span>
                    <span className="text-[10px] text-slate-500 ml-auto">{new Date().toLocaleDateString()}</span>
                  </div>
                  <textarea ref={textareaRef} value={currentEntry}
                    onChange={(e) => { setCurrentEntry(e.target.value); setIsTyping(true); }}
                    onBlur={() => setIsTyping(false)}
                    placeholder={`Enter your ${entryType}... (Markdown supported, #hashtags auto-tagged)`}
                    className="w-full bg-transparent text-slate-200 placeholder-slate-500 resize-none focus:outline-none text-sm leading-relaxed min-h-[80px]"
                    rows={3} />
                  {canvasData && (
                    <div className="mt-2 p-2 bg-slate-800/50 rounded-lg">
                      <img src={canvasData} alt="Canvas preview" className="max-h-32 rounded border border-slate-700/30" />
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700/20">
                    <div className="text-[10px] text-slate-500">
                      {isTyping && <span className="text-emerald-400 animate-pulse">●</span>}
                      <span className="ml-1">{currentEntry.length} chars</span>
                    </div>
                    <button onClick={addEntry} disabled={!currentEntry.trim() && !canvasData}
                      className="px-5 py-2 bg-slate-100 text-slate-900 rounded-lg text-xs font-semibold hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                      Record Entry
                    </button>
                  </div>
                </div>

                {/* Entries Feed */}
                {filteredEntries.map((entry) => {
                  const style = getEntryStyle(entry.type);
                  const isSelected = selectedEntryId === entry.id;
                  return (
                    <div key={entry.id} id={`entry-${entry.id}`}
                      className={`${style.bg} border ${style.border} rounded-xl p-4 transition-all duration-300 ${isSelected ? 'ring-2 ring-amber-500/30 ring-offset-2 ring-offset-slate-950' : ''}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{style.icon}</span>
                        <span className={`text-[10px] uppercase tracking-widest font-semibold ${style.color}`}>{style.label}</span>
                        <span className="text-[10px] text-slate-500 ml-auto">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                        <ReactMarkdown>{entry.content}</ReactMarkdown>
                      </div>
                      {/* World metadata display */}
                      {entry.type === 'world' && entry.metadata && (
                        <div className="mt-3 p-3 bg-slate-800/40 rounded-lg border border-violet-500/20">
                          <div className="text-[10px] text-violet-400 uppercase tracking-widest mb-2">World State Snapshot</div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                            <div>Seed: <span className="text-slate-200 font-mono">{entry.metadata.worldSeed}</span></div>
                            <div>Coherence: <span className="text-slate-200 font-mono">{entry.metadata.finalCoherence?.toFixed(4)}</span></div>
                            <div>Cycles: <span className="text-slate-200 font-mono">{entry.metadata.cyclesCompleted}</span></div>
                            <div>Palette: <span className="text-slate-200">{entry.metadata.worldParams?.palette}</span></div>
                          </div>
                          {entry.metadata.snapshotJSON && (
                            <button
                              onClick={() => {
                                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(entry.metadata.snapshotJSON);
                                const anchor = document.createElement('a');
                                anchor.href = dataStr;
                                anchor.download = `world_snapshot_${entry.metadata.worldSeed}.json`;
                                document.body.appendChild(anchor);
                                anchor.click();
                                document.body.removeChild(anchor);
                              }}
                              className="mt-2 px-3 py-1 bg-violet-500/10 border border-violet-500/30 text-violet-400 rounded text-[10px] hover:bg-violet-500/20 transition-all"
                            >
                              💾 Download State Recipe
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-700/20">
                        {entry.tags.map((tag) => (
                          <span key={tag} onClick={() => setSearchQuery(tag)}
                            className="px-2 py-0.5 bg-slate-800/60 rounded-md text-[10px] text-slate-400 border border-slate-700/30 hover:border-slate-500/30 cursor-pointer transition-all">
                            #{tag}
                          </span>
                        ))}
                        {entry.links.length > 0 && <span className="text-[10px] text-indigo-400/70">🔗 {entry.links.length} linked</span>}
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${entry.resonance_score * 100}%`,
                                  backgroundColor: entry.resonance_score > 0.8 ? '#fbbf24' : entry.resonance_score > 0.5 ? '#22d3ee' : '#94a3b8',
                                }} />
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{(entry.resonance_score * 100).toFixed(0)}%</span>
                          </div>
                          <button onClick={() => setShowEcho(prev => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                            className="text-[10px] text-slate-500 hover:text-amber-400 transition-colors">
                            {showEcho[entry.id] ? 'Hide Echo' : 'Show Echo'}
                          </button>
                          <button onClick={() => deleteEntry(entry.id)}
                            className="text-[10px] text-slate-600 hover:text-red-400 transition-colors">✕</button>
                        </div>
                      </div>
                      {showEcho[entry.id] && entry.echo && (
                        <div className="mt-3 p-3 bg-slate-800/40 rounded-lg border-l-2 border-amber-500/30">
                          <div className="flex items-start gap-2">
                            <span className="text-sm mt-0.5">🗣</span>
                            <div className="text-xs text-slate-400 italic leading-relaxed">{entry.echo}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredEntries.length === 0 && (
                  <div className="text-center py-16 text-slate-600">
                    <div className="text-5xl mb-4 opacity-50">📖</div>
                    <p className="text-sm">Your grimoire is empty.</p>
                    <p className="text-xs mt-1">Begin recording observations, hypotheses, spells, and dreams.</p>
                    <p className="text-xs mt-1">Or forge a world in the 🌌 Forge.</p>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'graph' && (
              <div className="h-full bg-slate-950">
                {entries.length > 0 ? (
                  <ResonanceGraph entries={entries} onNodeClick={(id) => {
                    setSelectedEntryId(id); setViewMode('feed');
                    setTimeout(() => document.getElementById(`entry-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                  }} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600">
                    <div className="text-center"><div className="text-4xl mb-3">🕸</div><p className="text-sm">Add entries to see your resonance web.</p></div>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'canvas' && (
              <div className="h-full">
                <DrawingCanvas onSave={(dataUrl) => { setCanvasData(dataUrl); setViewMode('feed'); }} />
              </div>
            )}

            {viewMode === 'forge' && (
              <div className="h-full">
                <WorldForge onSaveWorld={addWorldEntry} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
