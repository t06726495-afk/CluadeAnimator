import type {
  BlockCategory,
  DrillAgeTier,
  SkillLevel,
} from "@/lib/constants/enums";

export type DrillSeedEntry = {
  slug: string;
  name: string;
  category: BlockCategory;
  ageTiers: DrillAgeTier[];
  skillLevels: SkillLevel[];
  description: string;
  coachingCues: string;
  equipment: string;
};

const ALL_SKILL_LEVELS: SkillLevel[] = ["new", "intermediate", "competitive"];

// ============================================================================
// 6U-8U (T-ball / early coach-pitch)
// No static stretching at this tier. Short jog + arm circles into easy
// short-distance throwing (15-20 ft). Hitting is almost entirely tee work,
// high-rep and game-like; soft toss only lightly introduced late in this tier.
// Defense is simple, high-rep, low-pressure, two-hands-on-everything.
// Pitching is coach-pitch; any player work is grip/target games only.
// Mixed is light "coach flips it in" reps, not full scrimmage.
// ============================================================================

const TIER_6U_8U: DrillSeedEntry[] = [
  // Warm-Up
  {
    slug: "warmup-6u8u-jog-and-giggle",
    name: "Jog & Giggle Warm-Up",
    category: "warm-up",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Light jog around the bases or between cones for 2-3 minutes, followed by big arm circles forward and backward. No static stretching.",
    coachingCues:
      "Keep it playful and moving — no standing around. Arm circles should be big and loose, not held stretches. This age group does not need (and shouldn't do) static stretching before throwing.",
    equipment: "Cones or bases",
  },
  {
    slug: "warmup-6u8u-freeze-tag-toss",
    name: "Freeze Tag Toss",
    category: "warm-up",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Kids jog/shuffle in a group game of freeze tag for a couple minutes to get loose, then pair up for easy catch at 15 feet.",
    coachingCues:
      "Keep throwing distance short (15 ft to start). Watch for tired arms — this is about getting loose and having fun, not building arm strength yet.",
    equipment: "Balls",
  },
  {
    slug: "warmup-6u8u-arm-circle-countdown",
    name: "Arm Circle Countdown",
    category: "warm-up",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Count down from 10 big arm circles forward, 10 backward, then move straight into partner toss starting at 15 ft and creeping back to 20 ft.",
    coachingCues:
      "Make the countdown a group chant to keep energy up. Progress distance only if throws stay accurate — distance is secondary to a clean release.",
    equipment: "Balls",
  },
  {
    slug: "warmup-6u8u-bucket-base-jog",
    name: "Bucket Base Jog",
    category: "warm-up",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Easy-pace jog around the bases (walk the last one if needed), then a short throwing game: partners toss and catch, taking one step back each time they complete 3 catches in a row.",
    coachingCues:
      "This is a warm-up, not a fitness test — pace should stay easy and fun. Cap throwing distance around 20 ft for this age group.",
    equipment: "Bases, balls",
  },
  // Hitting
  {
    slug: "hitting-6u8u-tee-height-ladder",
    name: "Tee Height Ladder",
    category: "hitting",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Set the tee at three heights (low/thigh, middle/belt, high/chest) and have each hitter take 5 swings at each height before rotating.",
    coachingCues:
      "High rep count is the goal — keep the line moving. Focus on 'squish the bug' back-foot rotation and swinging level to the tee height, not on mechanics perfection.",
    equipment: "Tee, bats, balls",
  },
  {
    slug: "hitting-6u8u-bucket-derby",
    name: "Bucket Derby",
    category: "hitting",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Place buckets or cones at different spots in the infield/outfield worth different point values. Hitters hit off the tee and score points for landing balls near a bucket.",
    coachingCues:
      "Keep score light and fun, not competitive pressure. This is about high-rep contact with a game frame so kids want another turn.",
    equipment: "Tee, bats, balls, buckets or cones",
  },
  {
    slug: "hitting-6u8u-around-the-world-tee",
    name: "Around the World Tee",
    category: "hitting",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Move the tee to inside, middle, and outside plate positions. Hitters take a few swings from each position and try to hit the ball to a different field for each.",
    coachingCues:
      "Simple cue: 'inside pitch goes that way, outside pitch goes that way' — pointing is fine at this age. Reward good tries, not just results.",
    equipment: "Tee, bats, balls",
  },
  {
    slug: "hitting-6u8u-color-ball-challenge",
    name: "Color Ball Challenge",
    category: "hitting",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Use different colored balls (or balls with numbers) on the tee and have hitters call out the color/number right before they swing.",
    coachingCues:
      "Keeps eyes locked on the ball and adds a fun twist to plain tee reps. High rep count, quick rotation.",
    equipment: "Tee, bats, colored or numbered balls",
  },
  {
    slug: "hitting-6u8u-intro-soft-toss",
    name: "Intro Soft Toss",
    category: "hitting",
    ageTiers: ["6U-8U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "For hitters who have shown they're ready (late in this tier): coach or helper kneels close and tosses the ball gently underhand into the hitting zone toward a fence or net.",
    coachingCues:
      "Only introduce lightly and only for kids showing tee-work consistency — this is not the main diet at this age. Keep tosses soft, close, and to the same spot every time.",
    equipment: "Balls, net or fence backstop",
  },
  // Defense
  {
    slug: "defense-6u8u-bucket-grounders",
    name: "Bucket Grounders",
    category: "defense",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Coach rolls easy ground balls one at a time from short distance. Fielders use two hands to scoop and either toss into a bucket or hand the ball back.",
    coachingCues:
      "Two hands on everything. Keep the line moving for max reps — this is about repetition and comfort, not diving plays.",
    equipment: "Balls, bucket",
  },
  {
    slug: "defense-6u8u-pop-fly-parade",
    name: "Pop Fly Parade",
    category: "defense",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Coach softly tosses easy, short fly balls for each player to catch with two hands, one after another down the line.",
    coachingCues:
      "Keep tosses catchable and confidence-building. Two hands, 'watch it all the way into your glove.'",
    equipment: "Balls",
  },
  {
    slug: "defense-6u8u-freeze-and-field",
    name: "Freeze & Field",
    category: "defense",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Players start in a 'ready position' freeze, coach rolls a grounder, they field with two hands, then freeze again in ready position before the next rep.",
    coachingCues:
      "Reinforces the ready position habit between reps. Low pressure, high rep — no bad-hop panic at this age, just get in front and use two hands.",
    equipment: "Balls",
  },
  {
    slug: "defense-6u8u-short-hop-toss-back",
    name: "Short Hop Toss Back",
    category: "defense",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "After fielding a rolled ball with two hands, players toss it back to the coach or a partner from a short 15-20 ft distance.",
    coachingCues:
      "Keep throwing distance short and the focus on a clean, controlled toss rather than arm strength.",
    equipment: "Balls",
  },
  // Pitching (coach-pitch age — player work is grip/target games only)
  {
    slug: "pitching-6u8u-grip-and-show",
    name: "Grip & Show",
    category: "pitching",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Players learn how to hold a basic fastball grip (two fingers on top, thumb underneath) and simply show/check their grip — no throwing intensity involved.",
    coachingCues:
      "This age is coach-pitch. Keep any 'pitching' work to grip familiarity only — no mound mechanics or throwing off a mound.",
    equipment: "Balls",
  },
  {
    slug: "pitching-6u8u-target-toss-game",
    name: "Target Toss Game",
    category: "pitching",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Set up a bucket, hula hoop, or taped target on the ground/fence. Kids take turns tossing (not pitching hard) at the target from a short distance for fun points.",
    coachingCues:
      "This is an aim game, not a mechanics drill. Coaches still do the actual game pitching at this age.",
    equipment: "Balls, bucket or hula hoop target",
  },
  {
    slug: "pitching-6u8u-bullseye-toss",
    name: "Bullseye Toss",
    category: "pitching",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Chalk or tape a simple bullseye on a fence. Players toss underhand or overhand at the target from short range, scoring points for accuracy.",
    coachingCues:
      "Keep it playful and focused purely on aim — no velocity emphasis, no mound-distance work at this age.",
    equipment: "Balls",
  },
  // Mixed
  {
    slug: "mixed-6u8u-coach-flip-live",
    name: "Coach Flip Live",
    category: "mixed",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Coach flips or soft-tosses the ball to the batter (off a tee or a gentle flip), and defense reacts to the live ball in play. Simple, low-pressure live reps — not a full scrimmage.",
    coachingCues:
      "Keep pace relaxed and rotate everyone through hitting and fielding roles often. This is about getting comfortable with a ball in live play, not full game rules.",
    equipment: "Tee (optional), balls, bats",
  },
  {
    slug: "mixed-6u8u-live-bucket-ball",
    name: "Live Bucket Ball",
    category: "mixed",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Small groups rotate through hitter, fielder, and 'feeder' roles. The feeder (coach or helper) puts the ball in play gently and defense reacts.",
    coachingCues:
      "Rotate roles quickly to keep engagement up. Keep it light — the goal is comfort with live batted balls, not competitive scrimmage rules.",
    equipment: "Balls, bats, tee (optional)",
  },
];

// ============================================================================
// 9U-10U
// Light jog + dynamic movement, throwing progression 20 -> 40-46 ft.
// Tee + soft toss main diet, front toss introduced. Infield/outfield
// fundamentals, backhand, pop-up tracking. Pitch Smart: 75 pitches/day.
// ============================================================================

const TIER_9U_10U: DrillSeedEntry[] = [
  // Warm-Up
  {
    slug: "warmup-9u10u-dynamic-movement-line",
    name: "Dynamic Movement Line",
    category: "warm-up",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Light jog down and back, then a line of dynamic movement: high knees, butt kicks, and lateral shuffles, each for about 20 yards.",
    coachingCues:
      "Keep it dynamic (moving), not static holds. This builds the habit of a real warm-up routine that will carry into older age groups.",
    equipment: "Cones (optional to mark distance)",
  },
  {
    slug: "warmup-9u10u-progressive-catch-ladder",
    name: "Progressive Catch Ladder",
    category: "warm-up",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Partner catch starting at 20 ft, taking a few steps back every 5 clean catches, building out to 40-46 ft.",
    coachingCues:
      "Only extend distance if the throws stay on line — arm health matters more than reaching max distance. Full arm extension and a firm front-side glove target.",
    equipment: "Balls",
  },
  {
    slug: "warmup-9u10u-around-the-horn-warmup",
    name: "Around the Horn Warm-Up",
    category: "warm-up",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Light jog around the field perimeter, dynamic stretches (leg swings, arm swings), then progressive throwing partners finishing around 40-46 ft.",
    coachingCues:
      "A full but efficient routine — aim for under 10 minutes so it doesn't eat into practice time.",
    equipment: "Balls",
  },
  // Hitting
  {
    slug: "hitting-9u10u-tee-zone-targets",
    name: "Tee Work: Zone Targets",
    category: "hitting",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Set up target zones (cones or hula hoops) in the field. Hitters work off the tee trying to drive line drives into specific zones.",
    coachingCues:
      "Focus on a level, line-drive swing path rather than lifting the ball. Rotate tee position (inside/middle/outside) between rounds.",
    equipment: "Tee, bats, balls, cones",
  },
  {
    slug: "hitting-9u10u-soft-toss-rapid-fire",
    name: "Soft Toss Rapid Fire",
    category: "hitting",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Coach or helper kneels to the side behind a screen and tosses underhand into the hitting zone for quick, high-rep contact swings.",
    coachingCues:
      "Consistent toss location every rep. Cue hitters to keep hands inside the ball and stride/load on time with the toss.",
    equipment: "Balls, screen or net",
  },
  {
    slug: "hitting-9u10u-front-toss-intro",
    name: "Front Toss Intro",
    category: "hitting",
    ageTiers: ["9U-10U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Coach tosses underhand or easy overhand from in front (behind an L-screen) at a short distance, introducing timing against a pitch coming from the front.",
    coachingCues:
      "Use an L-screen for coach safety. Keep velocity low — the goal is timing against a front-thrown ball, not testing bat speed yet.",
    equipment: "Balls, bats, L-screen",
  },
  {
    slug: "hitting-9u10u-two-ball-mix",
    name: "Two-Ball Soft Toss Mix",
    category: "hitting",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Alternate rounds of tee work and soft toss in the same rotation so hitters build consistency across both.",
    coachingCues:
      "Tee and soft toss remain the main diet at this age — keep both in regular rotation rather than rushing to front toss for every hitter.",
    equipment: "Tee, balls, bats",
  },
  // Defense
  {
    slug: "defense-9u10u-backhand-box",
    name: "Backhand Box Drill",
    category: "defense",
    ageTiers: ["9U-10U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Coach hits or rolls balls just to the fielder's glove side, working backhand fielding technique in a defined zone.",
    coachingCues:
      "Get the glove down and out early, field it out in front rather than letting it get too close to the body.",
    equipment: "Balls, bat or hands for hit balls",
  },
  {
    slug: "defense-9u10u-pop-up-tracking",
    name: "Pop-Up Tracking",
    category: "defense",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Coach hits or throws pop-ups of varying heights. Players call 'I got it,' track the ball, and make the catch.",
    coachingCues:
      "Loud verbal calls to avoid collisions. Track the ball with two hands ready, drift under it rather than backpedaling flat-footed.",
    equipment: "Balls, bat (fungo optional)",
  },
  {
    slug: "defense-9u10u-infield-fundamentals-circuit",
    name: "Infield Fundamentals Circuit",
    category: "defense",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Rotating stations at each infield position: field a ground ball, set the feet, and throw to first at a distance matched to this field size.",
    coachingCues:
      "Emphasize proper footwork and a strong, accurate throw over pure arm strength. Keep throwing distances appropriate for the 9U-10U field, not full-size.",
    equipment: "Balls, bases, gloves",
  },
  {
    slug: "defense-9u10u-outfield-crow-hop-intro",
    name: "Outfield Crow Hop Intro",
    category: "defense",
    ageTiers: ["9U-10U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "After catching a fly ball, outfielders practice a basic crow-hop footwork pattern before making the throw back in.",
    coachingCues:
      "Simple 'catch, hop, throw' rhythm — this is an introduction, not full mechanics polish yet.",
    equipment: "Balls",
  },
  // Pitching
  {
    slug: "pitching-9u10u-balance-point-freeze",
    name: "Balance Point Freeze",
    category: "pitching",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Pitchers lift the front leg to their balance point and hold for a 2-count before continuing the delivery toward a target.",
    coachingCues:
      "Balance, not speed. A stable balance point is the foundation the rest of the delivery builds from.",
    equipment: "Balls, target or catcher",
  },
  {
    slug: "pitching-9u10u-target-windup-drill",
    name: "Target Windup Drill",
    category: "pitching",
    ageTiers: ["9U-10U"],
    skillLevels: ["new", "intermediate"],
    description:
      "Pitchers throw basic windup-position deliveries at a target (taped strike zone or catcher) from a mound distance appropriate for this level.",
    coachingCues:
      "Focus on repeating a simple, consistent motion and hitting the target — not velocity.",
    equipment: "Balls, target or catcher",
  },
  {
    slug: "pitching-9u10u-stretch-position-basics",
    name: "Stretch Position Basics",
    category: "pitching",
    ageTiers: ["9U-10U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Introduce the stretch/set position (no runners drill) — come set, small leg lift, deliver to the target.",
    coachingCues:
      "Keep it simple: come set, brief pause, go. This is an introduction, not full pickoff/timing work yet.",
    equipment: "Balls, target or catcher",
  },
  {
    slug: "pitching-9u10u-crow-hop-long-toss-intro",
    name: "Crow Hop Long Toss Intro",
    category: "pitching",
    ageTiers: ["9U-10U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Pair the crow-hop footwork pattern with easy long toss out to 40-46 ft, focused on a loose, full arm circle.",
    coachingCues:
      "This is arm-care and footwork introduction, not a max-distance contest.",
    equipment: "Balls",
  },
  {
    slug: "pitching-9u10u-pitch-smart-note",
    name: "Pitch Count Awareness Check-In",
    category: "pitching",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Before any pitching block, review with pitchers how pitch counts will be tracked for the day.",
    coachingCues:
      "Pitch Smart reference for 9U-10U: 75 pitches per day maximum. Track counts for every player who pitches, in practice and in games.",
    equipment: "None — pitch count tracker/clipboard",
  },
  // Mixed
  {
    slug: "mixed-9u10u-live-bp-with-defense",
    name: "Live BP with Defense",
    category: "mixed",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Live at-bats off a coach or pitching machine with a full defense in the field reacting to balls in play.",
    coachingCues:
      "Keep pace brisk with a pitch count/time limit per hitter so everyone gets fair reps.",
    equipment: "Balls, bats, L-screen, pitching machine (optional)",
  },
  {
    slug: "mixed-9u10u-runner-on-first-situations",
    name: "Runner on First Situations",
    category: "mixed",
    ageTiers: ["9U-10U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Live at-bats with a baserunner placed at first base, working basic situational defense (covering second, force plays).",
    coachingCues:
      "Keep the situation simple — one runner, one basic read. Build situational awareness gradually.",
    equipment: "Balls, bats, bases, L-screen",
  },
];

// ============================================================================
// 11U-12U
// Full dynamic stretch routine, light band/arm-care, throwing to full
// distance for this field size (50/70 or 60/90). Soft toss + front toss main
// diet, live BP introduced, two-strike approach lightly introduced.
// Cutoff/relay, double plays. Crow hop, long toss, changeup grip (no
// breaking balls). Pitch Smart: 85 pitches/day.
// ============================================================================

const TIER_11U_12U: DrillSeedEntry[] = [
  // Warm-Up
  {
    slug: "warmup-11u12u-dynamic-stretch-circuit",
    name: "Dynamic Stretch Circuit",
    category: "warm-up",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Full dynamic stretch routine: leg swings (front/back and side/side), carioca down and back, and walking lunges.",
    coachingCues:
      "Movement-based stretching only — the goal is to raise range of motion and body temperature before throwing, not to hold static stretches.",
    equipment: "None",
  },
  {
    slug: "warmup-11u12u-arm-care-band-series",
    name: "Arm Care Band Series",
    category: "warm-up",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Light resistance band series for the shoulder (internal/external rotation, rows, Y-raises) before throwing begins.",
    coachingCues:
      "Light resistance, controlled reps — this is activation, not a strength workout.",
    equipment: "Resistance bands",
  },
  {
    slug: "warmup-11u12u-long-toss-buildup",
    name: "Long Toss Build-Up",
    category: "warm-up",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Progressive partner throwing building out to full distance for this field size (50/70 or 60/90 depending on league).",
    coachingCues:
      "Note that many leagues move to a bigger field at this age, so throwing distances jump accordingly — build up gradually rather than jumping straight to max distance.",
    equipment: "Balls",
  },
  // Hitting
  {
    slug: "hitting-11u12u-front-toss-progression",
    name: "Front Toss Progression",
    category: "hitting",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Coach front-tosses from behind an L-screen, progressing speed/location gradually to sharpen timing and approach.",
    coachingCues:
      "Front toss is now a main-diet drill at this age — focus on load timing and staying through the middle of the field.",
    equipment: "Balls, bats, L-screen",
  },
  {
    slug: "hitting-11u12u-two-strike-approach-intro",
    name: "Two-Strike Approach Intro",
    category: "hitting",
    ageTiers: ["11U-12U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Soft toss or front toss reps simulating a two-strike count: shortened stride/hands, battle mentality, put the ball in play.",
    coachingCues:
      "Light introduction — choke up slightly, shorten the swing, prioritize contact over power in this look.",
    equipment: "Balls, bats, L-screen (for front toss)",
  },
  {
    slug: "hitting-11u12u-live-bp-rounds",
    name: "Live BP Rounds",
    category: "hitting",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Live batting practice off a coach pitching from the mound, defense in the field.",
    coachingCues:
      "This is where live BP gets introduced as a regular tool — track pitch counts if a player is throwing BP.",
    equipment: "Balls, bats, L-screen",
  },
  {
    slug: "hitting-11u12u-soft-toss-situational",
    name: "Soft Toss Situational",
    category: "hitting",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Soft toss reps with a directional goal — hit the inside toss to the pull side, the outside toss to the opposite field.",
    coachingCues:
      "Reinforces pitch location recognition and stresses hitting the ball where it's pitched.",
    equipment: "Balls, bats",
  },
  // Defense
  {
    slug: "defense-11u12u-cutoff-relay-progression",
    name: "Cutoff & Relay Progression",
    category: "defense",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Outfielder fields the ball and hits the cutoff, who relays to the appropriate base. Build from walk-through to full speed.",
    coachingCues:
      "Cutoff man should be in line and calling for the ball loudly. Emphasize accurate, chest-high relay throws.",
    equipment: "Balls, bases",
  },
  {
    slug: "defense-11u12u-double-play-turn",
    name: "Double Play Turn Drill",
    category: "defense",
    ageTiers: ["11U-12U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Middle infielders work the double play pivot and turn at second base — feed, footwork, and release.",
    coachingCues:
      "Start at half speed to build correct footwork before adding game speed. Glove-side feeds should lead the fielder toward the bag.",
    equipment: "Balls, bases",
  },
  {
    slug: "defense-11u12u-long-infield-throws",
    name: "Long Infield Throws",
    category: "defense",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Ground ball reps at each infield position with throws to first at the longer distances of the bigger field.",
    coachingCues:
      "Reinforce getting the feet set and driving the throw through the target rather than relying only on arm strength for the longer distance.",
    equipment: "Balls, bases",
  },
  // Pitching
  {
    slug: "pitching-11u12u-crow-hop-mechanics",
    name: "Crow Hop Mechanics",
    category: "pitching",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Full crow-hop footwork drill for arm care and long toss mechanics — catch, hop, load, throw.",
    coachingCues:
      "Emphasize a clean weight transfer through the crow hop into a full arm circle on the throw.",
    equipment: "Balls",
  },
  {
    slug: "pitching-11u12u-long-toss-ladder",
    name: "Long Toss Progression Ladder",
    category: "pitching",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Structured long toss building distance in stages, staying on a line and building arm strength gradually.",
    coachingCues:
      "Build distance in stages rather than jumping to max — pull back in and finish with a few crisp throws at a shorter distance.",
    equipment: "Balls",
  },
  {
    slug: "pitching-11u12u-changeup-grip-intro",
    name: "Changeup Grip Intro",
    category: "pitching",
    ageTiers: ["11U-12U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Introduce a basic changeup grip (circle change or three-finger change) thrown with the same arm speed as the fastball, no breaking balls at this age.",
    coachingCues:
      "Same arm speed as the fastball is the whole point — the grip does the work. No curveballs or sliders at this age.",
    equipment: "Balls, target or catcher",
  },
  {
    slug: "pitching-11u12u-bullpen-target-work",
    name: "Bullpen Target Work",
    category: "pitching",
    ageTiers: ["11U-12U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Controlled bullpen session focused on locating the fastball and newly-introduced changeup to a target.",
    coachingCues:
      "Track every pitch thrown. Quality of location over max effort.",
    equipment: "Balls, target or catcher",
  },
  {
    slug: "pitching-11u12u-pitch-smart-note",
    name: "Pitch Count Awareness Check-In",
    category: "pitching",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Before any pitching block, review with pitchers how pitch counts will be tracked for the day.",
    coachingCues:
      "Pitch Smart reference for 11U-12U: 85 pitches per day maximum. Track counts for every player who pitches, in practice and in games.",
    equipment: "None — pitch count tracker/clipboard",
  },
  // Mixed
  {
    slug: "mixed-11u12u-live-ab-real-defense",
    name: "Live At-Bats with Real Defense",
    category: "mixed",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Live at-bats off a coach or pitcher with a full defensive alignment behind it, playing out the ball in play.",
    coachingCues:
      "Track pitch counts for any player pitching. Rotate hitters and defensive spots so everyone gets game-speed reps.",
    equipment: "Balls, bats, bases, L-screen",
  },
  {
    slug: "mixed-11u12u-situational-team-defense",
    name: "Situational Team Defense",
    category: "mixed",
    ageTiers: ["11U-12U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Live at-bats with runners placed in various situations (runner on second, runners on first and second) to rep team defensive calls.",
    coachingCues:
      "Call out the situation before each rep so the defense communicates the play before the ball is hit.",
    equipment: "Balls, bats, bases, L-screen",
  },
];

// ============================================================================
// 13U-14U
// Full dynamic warm-up + light plyometric, arm-care bands, step-by-step
// throwing progression from knees at short distance to full long toss with
// mechanics cues. Front toss + live BP main diet, two-strike/situational BP
// regular. Full team defense: cutoffs, relays, DPs, situational reps. Full
// mound work, bullpen progression, arm care emphasized. Pitch Smart: 95/day.
// ============================================================================

const TIER_13U_14U: DrillSeedEntry[] = [
  // Warm-Up
  {
    slug: "warmup-13u14u-full-dynamic-warmup",
    name: "Full Dynamic Warm-Up",
    category: "warm-up",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Jog, full dynamic stretch series, and light plyometric work (skips, bounds, low-level hops) to prep the whole body.",
    coachingCues:
      "Plyometric work should stay light and controlled — this is prep for practice, not a conditioning session.",
    equipment: "None",
  },
  {
    slug: "warmup-13u14u-arm-care-band-routine",
    name: "Arm Care Band Routine",
    category: "warm-up",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Full resistance band series for the shoulder and rotator cuff before any throwing begins.",
    coachingCues:
      "This should be a non-negotiable daily habit at this age — arm care prevents the injuries that show up as workload increases.",
    equipment: "Resistance bands",
  },
  {
    slug: "warmup-13u14u-knees-to-long-toss",
    name: "Knees-to-Long-Toss Progression",
    category: "warm-up",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Step-by-step throwing progression: start on both knees at short distance focusing on arm path, move to a tall-kneeling position, then standing short toss, then build out step by step to full long toss distance.",
    coachingCues:
      "Cue proper mechanics at every step — tall posture, glove-side lead, full arm circle — rather than rushing to distance. Each phase should look clean before moving back.",
    equipment: "Balls",
  },
  // Hitting
  {
    slug: "hitting-13u14u-front-toss-timing",
    name: "Front Toss Timing Work",
    category: "hitting",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Coach front-tosses from behind an L-screen at game-relevant speed, refining load timing and approach against velocity.",
    coachingCues:
      "Front toss and live BP are the main diet at this age — prioritize game-speed timing work over tee reps.",
    equipment: "Balls, bats, L-screen",
  },
  {
    slug: "hitting-13u14u-live-bp-situational",
    name: "Live BP - Situational",
    category: "hitting",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Live batting practice with specific counts and situations assigned before each at-bat (e.g. runner on third less than two outs — get the run in).",
    coachingCues:
      "Call the situation before the pitch so the hitter has to execute an approach, not just swing away.",
    equipment: "Balls, bats, L-screen",
  },
  {
    slug: "hitting-13u14u-two-strike-battle-rounds",
    name: "Two-Strike Battle Rounds",
    category: "hitting",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Dedicated BP round where every pitch is treated as a two-strike count — shortened, defensive approach, battle to put the ball in play.",
    coachingCues:
      "This is a regular block at this age, not an occasional add-on. Reward fouling off tough pitches and putting the ball in play over swinging and missing.",
    equipment: "Balls, bats, L-screen",
  },
  {
    slug: "hitting-13u14u-live-bp-directional",
    name: "Live BP - Pull/Oppo Focus",
    category: "hitting",
    ageTiers: ["13U-14U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Live BP where the hitter calls a field (pull side or opposite field) before the pitch and is scored on executing it.",
    coachingCues:
      "Builds pitch-location recognition and the ability to drive the ball where it's pitched under game speed.",
    equipment: "Balls, bats, L-screen",
  },
  // Defense
  {
    slug: "defense-13u14u-full-team-situations",
    name: "Full Team Defense Situations",
    category: "defense",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Live defensive reps across a range of base/out state combinations, with a coach hitting fungo to force real decisions.",
    coachingCues:
      "Call the situation, run it live, then reset and debrief the correct read before moving to the next one.",
    equipment: "Balls, bats (fungo), bases",
  },
  {
    slug: "defense-13u14u-cutoff-relay-full-team",
    name: "Cutoff & Relay - Full Team",
    category: "defense",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Full-speed cutoff and relay execution with outfielders, cutoff infielders, and base coverage all working together on balls hit to every gap.",
    coachingCues:
      "Every throw should have a purpose — hitting the cutoff chest-high, cutoff reading whether to cut or let it through.",
    equipment: "Balls, bases",
  },
  {
    slug: "defense-13u14u-double-play-series",
    name: "Double Play Series",
    category: "defense",
    ageTiers: ["13U-14U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Advanced double play work covering standard feeds, backhand flips, and tag-and-throw variations at second base.",
    coachingCues:
      "Work each variation individually before mixing them randomly into live-speed reps.",
    equipment: "Balls, bases",
  },
  {
    slug: "defense-13u14u-first-third-defense",
    name: "First & Third Defense",
    category: "defense",
    ageTiers: ["13U-14U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Situational defense specifically for runners on first and third, covering the defense's options against the double steal.",
    coachingCues:
      "Assign each player their exact responsibility for this look before running it live so there's no hesitation.",
    equipment: "Balls, bases",
  },
  // Pitching
  {
    slug: "pitching-13u14u-flat-ground-bullpen",
    name: "Flat Ground Bullpen",
    category: "pitching",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Reduced-effort bullpen thrown on flat ground, focused purely on mechanics and repeating the delivery.",
    coachingCues:
      "This is the first step in the bullpen progression — effort stays well below game intensity.",
    equipment: "Balls, target or catcher",
  },
  {
    slug: "pitching-13u14u-bullpen-progression-to-mound",
    name: "Bullpen Progression to Mound",
    category: "pitching",
    ageTiers: ["13U-14U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Bullpen intensity builds in stages from flat ground to the mound, increasing effort level only once mechanics hold up.",
    coachingCues:
      "Do not jump straight to full mound intensity — progress the effort level step by step across sessions.",
    equipment: "Balls, target or catcher",
  },
  {
    slug: "pitching-13u14u-full-mound-bullpen",
    name: "Full Mound Bullpen",
    category: "pitching",
    ageTiers: ["13U-14U"],
    skillLevels: ["competitive"],
    description:
      "Full-intensity mound bullpen session with pitch counts tracked and specific pitches called by the coach.",
    coachingCues:
      "Every pitch counts toward the daily limit — track it live on a pitch count sheet, not from memory.",
    equipment: "Balls, target or catcher",
  },
  {
    slug: "pitching-13u14u-arm-care-recovery",
    name: "Arm Care Recovery Routine",
    category: "pitching",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Post-throwing band and light stretching routine done immediately after any bullpen or mound work.",
    coachingCues:
      "Arm care after throwing matters as much as the warm-up before it — don't skip this once the bullpen is over.",
    equipment: "Resistance bands",
  },
  {
    slug: "pitching-13u14u-pitch-smart-note",
    name: "Pitch Count Awareness Check-In",
    category: "pitching",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Before any pitching block, review with pitchers how pitch counts will be tracked for the day.",
    coachingCues:
      "Pitch Smart reference for 13U-14U: 95 pitches per day maximum. Track counts for every player who pitches, in practice and in games.",
    equipment: "None — pitch count tracker/clipboard",
  },
  // Mixed
  {
    slug: "mixed-13u14u-full-live-scrimmage",
    name: "Full Live Scrimmage",
    category: "mixed",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Full live scrimmage-style at-bats with real game situations (counts, base/out states) called before each play.",
    coachingCues:
      "Track pitch counts for anyone pitching live. Debrief situational reads briefly between innings to reinforce learning.",
    equipment: "Balls, bats, bases, L-screen",
  },
  {
    slug: "mixed-13u14u-game-situation-series",
    name: "Game Situation Series",
    category: "mixed",
    ageTiers: ["13U-14U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "A structured series of scrimmage at-bats cycling through specific game situations (bunt defense, suicide squeeze defense, tag-up situations).",
    coachingCues:
      "Announce each situation clearly before the pitch so both sides execute with intent, not guesswork.",
    equipment: "Balls, bats, bases, L-screen",
  },
];

export const DRILL_SEED: DrillSeedEntry[] = [
  ...TIER_6U_8U,
  ...TIER_9U_10U,
  ...TIER_11U_12U,
  ...TIER_13U_14U,
];
