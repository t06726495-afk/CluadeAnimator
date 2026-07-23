import type {
  BlockCategory,
  DrillAgeTier,
  SkillLevel,
} from "@/lib/constants/enums";
import type { DiagramType } from "@/lib/drills/diagramTypes";

export type DrillSeedEntry = {
  slug: string;
  name: string;
  category: BlockCategory;
  ageTiers: DrillAgeTier[];
  skillLevels: SkillLevel[];
  description: string;
  coachingCues: string;
  equipment: string;
  diagramType?: DiagramType;
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
      "Keep it playful and moving. No standing around. Arm circles should be big and loose, not held stretches. This age group does not need (and shouldn't do) static stretching before throwing.",
    equipment: "Cones or bases",
    diagramType: "warmup-jog",
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
      "Keep throwing distance short (15 ft to start). Watch for tired arms. This is about getting loose and having fun, not building arm strength yet.",
    equipment: "Balls",
    diagramType: "warmup-jog",
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
      "Make the countdown a group chant to keep energy up. Progress distance only if throws stay accurate. Distance is secondary to a clean release.",
    equipment: "Balls",
    diagramType: "warmup-jog",
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
      "This is a warm-up, not a fitness test. Pace should stay easy and fun. Cap throwing distance around 20 ft for this age group.",
    equipment: "Bases, balls",
    diagramType: "warmup-jog",
  },
  {
    slug: "warmup-6u8u-high-five-relay-jog",
    name: "High Five Relay Jog",
    category: "warm-up",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Jog in a loose line around the bases, high-fiving a coach or teammate at each base, then pair up for easy short-distance catch.",
    coachingCues:
      "Keep the pace light and social. The high fives are there to make the jog feel like a game, not a lap.",
    equipment: "Bases, balls",
    diagramType: "warmup-jog",
  },
  {
    slug: "warmup-6u8u-cone-weave-jog",
    name: "Cone Weave Jog",
    category: "warm-up",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Light jog weaving through a line of cones, then partner toss starting at 15 ft.",
    coachingCues:
      "Weaving keeps it playful while still getting bodies moving. No static stretching before or after.",
    equipment: "Cones, balls",
    diagramType: "warmup-jog",
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
      "High rep count is the goal. Keep the line moving. Focus on 'squish the bug' back-foot rotation and swinging level to the tee height, not on mechanics perfection.",
    equipment: "Tee, bats, balls",
    diagramType: "tee-multi",
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
    diagramType: "tee-single",
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
      "Simple cue: 'inside pitch goes that way, outside pitch goes that way'. Pointing is fine at this age. Reward good tries, not just results.",
    equipment: "Tee, bats, balls",
    diagramType: "tee-multi",
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
    diagramType: "tee-single",
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
      "Only introduce lightly and only for kids showing tee-work consistency. This is not the main diet at this age. Keep tosses soft, close, and to the same spot every time.",
    equipment: "Balls, net or fence backstop",
    diagramType: "soft-toss",
  },
  {
    slug: "hitting-6u8u-rainbow-tee-circuit",
    name: "Rainbow Tee Circuit",
    category: "hitting",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Set the tee at varying heights with colored target rings laid out in the field. Hitters try to land the ball inside a ring for points, high rep count.",
    coachingCues:
      "Keep the line moving fast. The goal is reps and fun, not precision. Celebrate any ball landing in a ring.",
    equipment: "Tee, bats, balls, cones or rings",
    diagramType: "tee-multi",
  },
  {
    slug: "hitting-6u8u-home-run-derby",
    name: "Tee Ball Home Run Derby",
    category: "hitting",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Simple tee-hitting game where hitters score points based on which zone of the field the ball lands in, with a fun 'derby' framing.",
    coachingCues:
      "Keep it light and game-like. This is about excitement for hitting off the tee, not swing mechanics critique.",
    equipment: "Tee, bats, balls, cones",
    diagramType: "tee-single",
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
      "Two hands on everything. Keep the line moving for max reps. This is about repetition and comfort, not diving plays.",
    equipment: "Balls, bucket",
    diagramType: "bucket-drill",
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
    diagramType: "pop-up",
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
      "Reinforces the ready position habit between reps. Low pressure, high rep. No bad-hop panic at this age, just get in front and use two hands.",
    equipment: "Balls",
    diagramType: "bucket-drill",
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
    diagramType: "bucket-drill",
  },
  {
    slug: "defense-6u8u-two-hands-challenge",
    name: "Two Hands Challenge",
    category: "defense",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Bucket-style ground ball reps where the coach tracks each player's streak of clean two-hand fields, cheering on new personal bests.",
    coachingCues:
      "The streak is just a fun hook. The real focus stays on two hands and a good ready position every rep.",
    equipment: "Balls, bucket",
    diagramType: "bucket-drill",
  },
  {
    slug: "defense-6u8u-catch-and-cheer",
    name: "Fly Ball Catch and Cheer",
    category: "defense",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Easy self-toss or coach-toss fly balls caught with two hands, with the group cheering each catch to build confidence.",
    coachingCues:
      "Keep tosses short and catchable. The cheering is there to build fly-ball confidence, which many kids lack at this age.",
    equipment: "Balls",
    diagramType: "pop-up",
  },
  // Pitching (coach-pitch age; player work is grip/target games only)
  {
    slug: "pitching-6u8u-grip-and-show",
    name: "Grip & Show",
    category: "pitching",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Players learn how to hold a basic fastball grip (two fingers on top, thumb underneath) and simply show/check their grip. No throwing intensity involved.",
    coachingCues:
      "This age is coach-pitch. Keep any 'pitching' work to grip familiarity only. No mound mechanics or throwing off a mound.",
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
    diagramType: "target-toss",
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
      "Keep it playful and focused purely on aim. No velocity emphasis, no mound-distance work at this age.",
    equipment: "Balls",
    diagramType: "target-toss",
  },
  {
    slug: "pitching-6u8u-sock-target-toss",
    name: "Sock Target Toss",
    category: "pitching",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Toss a ball or beanbag at a soft target (rolled sock, beanbag, hula hoop) from a short distance for fun accuracy points. No throwing intensity.",
    coachingCues:
      "This is purely an aim game to keep pitching-adjacent fun without any mound work or velocity focus.",
    equipment: "Balls or beanbags, soft target",
    diagramType: "target-toss",
  },
  {
    slug: "pitching-6u8u-copy-the-grip",
    name: "Copy the Grip",
    category: "pitching",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Coach shows a basic grip, players mimic it and check each other's grip with a partner. No throwing at all.",
    coachingCues:
      "Pure grip familiarity, no throwing component. This age is coach-pitch, so there's no rush to build pitching mechanics.",
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
      "Coach flips or soft-tosses the ball to the batter (off a tee or a gentle flip), and defense reacts to the live ball in play. Simple, low-pressure live reps. Not a full scrimmage.",
    coachingCues:
      "Keep pace relaxed and rotate everyone through hitting and fielding roles often. This is about getting comfortable with a ball in live play, not full game rules.",
    equipment: "Tee (optional), balls, bats",
    diagramType: "live-bp",
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
      "Rotate roles quickly to keep engagement up. Keep it light. The goal is comfort with live batted balls, not competitive scrimmage rules.",
    equipment: "Balls, bats, tee (optional)",
    diagramType: "bucket-drill",
  },
  {
    slug: "mixed-6u8u-tee-live-rounds",
    name: "Tee Ball Live Rounds",
    category: "mixed",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Hitters take a swing off the tee, then defense fields the live ball and makes a simple play, rotating through roles quickly.",
    coachingCues:
      "Keep the rotation fast so everyone gets both hitting and fielding reps in a short window.",
    equipment: "Tee, balls, bats",
    diagramType: "live-bp",
  },
  {
    slug: "mixed-6u8u-coach-toss-scramble",
    name: "Coach Toss Scramble",
    category: "mixed",
    ageTiers: ["6U-8U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Coach tosses the ball in gently, the batter makes contact, and the defense scrambles to field it in a fun, low-pressure scramble format.",
    coachingCues:
      "Keep the energy high and the pressure low. Mistakes should be met with encouragement, not correction, at this age.",
    equipment: "Balls, bats",
    diagramType: "bucket-drill",
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
    diagramType: "warmup-jog",
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
      "Only extend distance if the throws stay on line. Arm health matters more than reaching max distance. Full arm extension and a firm front-side glove target.",
    equipment: "Balls",
    diagramType: "long-toss",
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
      "A full but efficient routine. Aim for under 10 minutes so it doesn't eat into practice time.",
    equipment: "Balls",
    diagramType: "warmup-jog",
  },
  {
    slug: "warmup-9u10u-lateral-shuffle-ladder",
    name: "Lateral Shuffle Ladder",
    category: "warm-up",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Dynamic lateral shuffles and high knees down a marked line before moving into partner throwing.",
    coachingCues:
      "Stay low and controlled on the shuffles. This is dynamic movement prep, not a race.",
    equipment: "Cones",
    diagramType: "warmup-jog",
  },
  {
    slug: "warmup-9u10u-partner-mirror-warmup",
    name: "Partner Mirror Warm-Up",
    category: "warm-up",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Partners mirror each other's dynamic movements (high knees, lunges, shuffles), then move into progressive catch out to 40 ft.",
    coachingCues:
      "Mirroring keeps engagement up during the dynamic movement portion before throwing begins.",
    equipment: "Balls",
    diagramType: "long-toss",
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
    diagramType: "tee-multi",
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
    diagramType: "soft-toss",
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
      "Use an L-screen for coach safety. Keep velocity low. The goal is timing against a front-thrown ball, not testing bat speed yet.",
    equipment: "Balls, bats, L-screen",
    diagramType: "front-toss",
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
      "Tee and soft toss remain the main diet at this age. Keep both in regular rotation rather than rushing to front toss for every hitter.",
    equipment: "Tee, balls, bats",
    diagramType: "tee-single",
  },
  {
    slug: "hitting-9u10u-tee-to-front-toss-ladder",
    name: "Tee to Front Toss Ladder",
    category: "hitting",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "A progression round: hitters take tee reps first, then move directly into front toss reps in the same rotation.",
    coachingCues:
      "The tee reps groove the swing path; the front toss reps add timing on top of it in the same session.",
    equipment: "Tee, balls, bats, L-screen",
    diagramType: "front-toss",
  },
  {
    slug: "hitting-9u10u-soft-toss-target-zones",
    name: "Soft Toss Target Zones",
    category: "hitting",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Soft toss reps with cone-marked target zones in the field, rewarding hitters for placing contact into a zone.",
    coachingCues:
      "Keeps soft toss purposeful beyond just contact. Start building an awareness of where the ball goes.",
    equipment: "Balls, cones",
    diagramType: "soft-toss",
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
    diagramType: "backhand",
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
    diagramType: "pop-up",
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
    diagramType: "ground-ball",
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
      "Simple 'catch, hop, throw' rhythm. This is an introduction, not full mechanics polish yet.",
    equipment: "Balls",
    diagramType: "crow-hop",
  },
  {
    slug: "defense-9u10u-angle-ground-ball",
    name: "Angle Ground Ball Drill",
    category: "defense",
    ageTiers: ["9U-10U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Ground balls hit at angles requiring fielders to range side to side, then throw to first at a field-appropriate distance.",
    coachingCues:
      "Emphasize getting the body in front when possible and squaring up before the throw.",
    equipment: "Balls, bases",
    diagramType: "ground-ball",
  },
  {
    slug: "defense-9u10u-relay-basics",
    name: "Relay Basics",
    category: "defense",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Simple two-player relay from the outfield to an infield cutoff spot, introducing the concept of a relay throw.",
    coachingCues:
      "Keep it to two players and a short distance. The goal is understanding the concept, not full-speed execution yet.",
    equipment: "Balls",
    diagramType: "cutoff-relay",
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
    diagramType: "bullpen",
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
      "Focus on repeating a simple, consistent motion and hitting the target. Not velocity.",
    equipment: "Balls, target or catcher",
    diagramType: "bullpen",
  },
  {
    slug: "pitching-9u10u-stretch-position-basics",
    name: "Stretch Position Basics",
    category: "pitching",
    ageTiers: ["9U-10U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Introduce the stretch/set position (no runners drill). Come set, small leg lift, deliver to the target.",
    coachingCues:
      "Keep it simple: come set, brief pause, go. This is an introduction, not full pickoff/timing work yet.",
    equipment: "Balls, target or catcher",
    diagramType: "bullpen",
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
    diagramType: "long-toss",
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
    equipment: "None (pitch count tracker/clipboard)",
  },
  {
    slug: "pitching-9u10u-set-position-target-game",
    name: "Set Position Target Game",
    category: "pitching",
    ageTiers: ["9U-10U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Pitchers throw from the stretch position at a target for accuracy points, no baserunners involved.",
    coachingCues:
      "Keep the focus on a repeatable, quick set position and hitting the target. Not on holding runners yet.",
    equipment: "Balls, target or catcher",
    diagramType: "bullpen",
  },
  {
    slug: "pitching-9u10u-two-seam-grip-intro",
    name: "Two-Seam Grip Intro",
    category: "pitching",
    ageTiers: ["9U-10U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Introduce a simple two-seam fastball grip variation, thrown at low effort toward a target to build feel.",
    coachingCues:
      "Low effort only. This is about grip feel, not adding velocity or movement pressure at this age.",
    equipment: "Balls, target or catcher",
    diagramType: "bullpen",
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
    diagramType: "live-bp",
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
      "Keep the situation simple. One runner, one basic read. Build situational awareness gradually.",
    equipment: "Balls, bats, bases, L-screen",
    diagramType: "team-defense",
  },
  {
    slug: "mixed-9u10u-machine-bp-with-defense",
    name: "Machine BP with Defense",
    category: "mixed",
    ageTiers: ["9U-10U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Live at-bats off a pitching machine with a full defense reacting to balls in play, giving hitters a consistent look.",
    coachingCues:
      "A machine keeps pitch location consistent. Useful for hitters still building timing against a live arm.",
    equipment: "Balls, bats, pitching machine, L-screen",
    diagramType: "live-bp",
  },
  {
    slug: "mixed-9u10u-first-and-second-situations",
    name: "First and Second Situations",
    category: "mixed",
    ageTiers: ["9U-10U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Live at-bats with runners placed on first and second, working basic team defense reads for the added runner.",
    coachingCues:
      "Keep the situation calls simple and consistent so players start recognizing the pattern.",
    equipment: "Balls, bats, bases, L-screen",
    diagramType: "team-defense",
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
      "Movement-based stretching only. The goal is to raise range of motion and body temperature before throwing, not to hold static stretches.",
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
      "Light resistance, controlled reps. This is activation, not a strength workout.",
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
      "Note that many leagues move to a bigger field at this age, so throwing distances jump accordingly. Build up gradually rather than jumping straight to max distance.",
    equipment: "Balls",
    diagramType: "long-toss",
  },
  {
    slug: "warmup-11u12u-band-activation-series",
    name: "Band Activation Series",
    category: "warm-up",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "A focused shoulder band activation series done before any throwing begins, light resistance throughout.",
    coachingCues:
      "This is activation, not strength training. Keep resistance light and reps controlled.",
    equipment: "Resistance bands",
  },
  {
    slug: "warmup-11u12u-progressive-long-toss",
    name: "Progressive Long Toss",
    category: "warm-up",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Partner throwing that builds step by step out to full field-size distance, emphasizing an easy arcing throw as distance increases.",
    coachingCues:
      "Let the throw arc naturally as distance grows rather than forcing a flat, high-effort line drive throw.",
    equipment: "Balls",
    diagramType: "long-toss",
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
      "Front toss is now a main-diet drill at this age. Focus on load timing and staying through the middle of the field.",
    equipment: "Balls, bats, L-screen",
    diagramType: "front-toss",
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
      "Light introduction. Choke up slightly, shorten the swing, prioritize contact over power in this look.",
    equipment: "Balls, bats, L-screen (for front toss)",
    diagramType: "soft-toss",
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
      "This is where live BP gets introduced as a regular tool. Track pitch counts if a player is throwing BP.",
    equipment: "Balls, bats, L-screen",
    diagramType: "live-bp",
  },
  {
    slug: "hitting-11u12u-soft-toss-situational",
    name: "Soft Toss Situational",
    category: "hitting",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Soft toss reps with a directional goal. Hit the inside toss to the pull side, the outside toss to the opposite field.",
    coachingCues:
      "Reinforces pitch location recognition and stresses hitting the ball where it's pitched.",
    equipment: "Balls, bats",
    diagramType: "soft-toss",
  },
  {
    slug: "hitting-11u12u-oppo-pull-soft-toss",
    name: "Oppo/Pull Soft Toss",
    category: "hitting",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Directional soft toss reps alternating between pull-side and opposite-field contact goals for each round.",
    coachingCues:
      "Call out the target field before the toss so hitters practice adjusting their contact point on demand.",
    equipment: "Balls, bats",
    diagramType: "soft-toss",
  },
  {
    slug: "hitting-11u12u-front-toss-two-strike-mix",
    name: "Front Toss Two-Strike Mix",
    category: "hitting",
    ageTiers: ["11U-12U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Alternating rounds of normal front toss and two-strike approach front toss to build both power and battle mentality.",
    coachingCues:
      "Announce which round it is before each set so hitters adjust their approach intentionally.",
    equipment: "Balls, bats, L-screen",
    diagramType: "front-toss",
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
    diagramType: "cutoff-relay",
  },
  {
    slug: "defense-11u12u-double-play-turn",
    name: "Double Play Turn Drill",
    category: "defense",
    ageTiers: ["11U-12U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Middle infielders work the double play pivot and turn at second base. Feed, footwork, and release.",
    coachingCues:
      "Start at half speed to build correct footwork before adding game speed. Glove-side feeds should lead the fielder toward the bag.",
    equipment: "Balls, bases",
    diagramType: "double-play",
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
    diagramType: "ground-ball",
  },
  {
    slug: "defense-11u12u-first-base-footwork",
    name: "First Base Footwork Circuit",
    category: "defense",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Reps at first base working the stretch, scoop on short-hop throws, and footwork around the bag on incoming throws.",
    coachingCues:
      "Emphasize staying in contact with the bag until fully stretched, and picking short-hop throws cleanly.",
    equipment: "Balls, bases",
    diagramType: "ground-ball",
  },
  {
    slug: "defense-11u12u-pop-up-priority-calls",
    name: "Pop-Up Priority Calls",
    category: "defense",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Infield and outfield pop-ups hit between two fielders, requiring loud priority calls to avoid collisions.",
    coachingCues:
      "Outfielder has priority over infielder on shared pop-ups. Call it loud and early, and the other fielder gets out of the way.",
    equipment: "Balls, bat (fungo optional)",
    diagramType: "pop-up",
  },
  // Pitching
  {
    slug: "pitching-11u12u-crow-hop-mechanics",
    name: "Crow Hop Mechanics",
    category: "pitching",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Full crow-hop footwork drill for arm care and long toss mechanics. Catch, hop, load, throw.",
    coachingCues:
      "Emphasize a clean weight transfer through the crow hop into a full arm circle on the throw.",
    equipment: "Balls",
    diagramType: "crow-hop",
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
      "Build distance in stages rather than jumping to max. Pull back in and finish with a few crisp throws at a shorter distance.",
    equipment: "Balls",
    diagramType: "long-toss",
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
      "Same arm speed as the fastball is the whole point. The grip does the work. No curveballs or sliders at this age.",
    equipment: "Balls, target or catcher",
    diagramType: "bullpen",
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
    diagramType: "bullpen",
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
    equipment: "None (pitch count tracker/clipboard)",
  },
  {
    slug: "pitching-11u12u-mound-target-bullpen",
    name: "Mound Target Bullpen",
    category: "pitching",
    ageTiers: ["11U-12U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Bullpen session working fastball command to inside and outside target zones at the plate.",
    coachingCues:
      "Track pitch counts against the 85/day limit for this tier. Prioritize hitting the called zone over max velocity.",
    equipment: "Balls, target or catcher",
    diagramType: "bullpen",
  },
  {
    slug: "pitching-11u12u-pickoff-move-basics",
    name: "Pickoff Move Basics",
    category: "pitching",
    ageTiers: ["11U-12U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Basic pickoff move to first base worked from the stretch position, no live runner involved yet.",
    coachingCues:
      "Focus on a legal, balanced move. Quick but controlled, not rushed to the point of a balk.",
    equipment: "Balls, bases",
    diagramType: "bullpen",
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
    diagramType: "live-scrimmage",
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
    diagramType: "team-defense",
  },
  {
    slug: "mixed-11u12u-two-out-situations",
    name: "Two-Out Situations",
    category: "mixed",
    ageTiers: ["11U-12U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Live at-bats simulating two-out situational defense and baserunning decisions.",
    coachingCues:
      "Remind the defense that force plays change with two outs. Reads should reflect the actual out count.",
    equipment: "Balls, bats, bases, L-screen",
    diagramType: "team-defense",
  },
  {
    slug: "mixed-11u12u-live-bp-scoring-situations",
    name: "Live BP Scoring Situations",
    category: "mixed",
    ageTiers: ["11U-12U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Live at-bats with runners in scoring position, working both situational hitting and team defense reps together.",
    coachingCues:
      "Call the situation before every pitch so both the hitter and the defense have a clear job on that rep.",
    equipment: "Balls, bats, bases, L-screen",
    diagramType: "live-scrimmage",
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
      "Plyometric work should stay light and controlled. This is prep for practice, not a conditioning session.",
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
      "This should be a non-negotiable daily habit at this age. Arm care prevents the injuries that show up as workload increases.",
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
      "Cue proper mechanics at every step (tall posture, glove-side lead, full arm circle) rather than rushing to distance. Each phase should look clean before moving back.",
    equipment: "Balls",
    diagramType: "long-toss",
  },
  {
    slug: "warmup-13u14u-plyo-bound-circuit",
    name: "Plyo Bound Circuit",
    category: "warm-up",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Light bounding and skipping plyometric circuit worked into the full dynamic warm-up routine.",
    coachingCues:
      "Keep intensity low-to-moderate. This primes the body for practice, it isn't a conditioning workout.",
    equipment: "None",
  },
  {
    slug: "warmup-13u14u-full-long-toss-progression",
    name: "Full Long Toss Progression",
    category: "warm-up",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Complete long toss progression out to maximum comfortable distance and back down, with mechanics cues at each stage.",
    coachingCues:
      "Build out gradually and bring it back down with the same care. The pull-down phase matters as much as the build-up.",
    equipment: "Balls",
    diagramType: "long-toss",
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
      "Front toss and live BP are the main diet at this age. Prioritize game-speed timing work over tee reps.",
    equipment: "Balls, bats, L-screen",
    diagramType: "front-toss",
  },
  {
    slug: "hitting-13u14u-live-bp-situational",
    name: "Live BP - Situational",
    category: "hitting",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Live batting practice with specific counts and situations assigned before each at-bat (e.g. runner on third, less than two outs: get the run in).",
    coachingCues:
      "Call the situation before the pitch so the hitter has to execute an approach, not just swing away.",
    equipment: "Balls, bats, L-screen",
    diagramType: "live-bp",
  },
  {
    slug: "hitting-13u14u-two-strike-battle-rounds",
    name: "Two-Strike Battle Rounds",
    category: "hitting",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Dedicated BP round where every pitch is treated as a two-strike count. Shortened, defensive approach, battle to put the ball in play.",
    coachingCues:
      "This is a regular block at this age, not an occasional add-on. Reward fouling off tough pitches and putting the ball in play over swinging and missing.",
    equipment: "Balls, bats, L-screen",
    diagramType: "front-toss",
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
    diagramType: "live-bp",
  },
  {
    slug: "hitting-13u14u-front-toss-velocity-ladder",
    name: "Front Toss Velocity Ladder",
    category: "hitting",
    ageTiers: ["13U-14U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Front toss delivered at increasing speed tiers across rounds to sharpen timing against faster velocity.",
    coachingCues:
      "Only increase speed once timing looks clean at the current tier. Don't rush the ladder.",
    equipment: "Balls, bats, L-screen",
    diagramType: "front-toss",
  },
  {
    slug: "hitting-13u14u-live-bp-risp",
    name: "Live BP Runners in Scoring Position",
    category: "hitting",
    ageTiers: ["13U-14U"],
    skillLevels: ALL_SKILL_LEVELS,
    description:
      "Live batting practice with runners in scoring position for every at-bat, requiring a situational hitting approach.",
    coachingCues:
      "Reinforce approach over results. Moving a runner or getting a productive out counts as success here.",
    equipment: "Balls, bats, L-screen",
    diagramType: "live-bp",
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
    diagramType: "team-defense",
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
      "Every throw should have a purpose. Hitting the cutoff chest-high, cutoff reading whether to cut or let it through.",
    equipment: "Balls, bases",
    diagramType: "cutoff-relay",
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
    diagramType: "double-play",
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
    diagramType: "team-defense",
  },
  {
    slug: "defense-13u14u-rundown-execution",
    name: "Run-Down Execution",
    category: "defense",
    ageTiers: ["13U-14U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Rundown mechanics between bases worked with full communication between the fielders involved.",
    coachingCues:
      "Fewer throws is better. Close the gap and force the tag rather than throwing back and forth repeatedly.",
    equipment: "Balls, bases",
    diagramType: "team-defense",
  },
  {
    slug: "defense-13u14u-relay-accuracy-ladder",
    name: "Relay Accuracy Ladder",
    category: "defense",
    ageTiers: ["13U-14U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Full-speed relay throws worked at increasing distances with accuracy scored at each stage.",
    coachingCues:
      "Accuracy and a quick exchange matter more than pure arm strength on the relay throw.",
    equipment: "Balls, bases",
    diagramType: "cutoff-relay",
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
      "This is the first step in the bullpen progression. Effort stays well below game intensity.",
    equipment: "Balls, target or catcher",
    diagramType: "bullpen",
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
      "Do not jump straight to full mound intensity. Progress the effort level step by step across sessions.",
    equipment: "Balls, target or catcher",
    diagramType: "bullpen",
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
      "Every pitch counts toward the daily limit. Track it live on a pitch count sheet, not from memory.",
    equipment: "Balls, target or catcher",
    diagramType: "bullpen",
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
      "Arm care after throwing matters as much as the warm-up before it. Don't skip this once the bullpen is over.",
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
    equipment: "None (pitch count tracker/clipboard)",
  },
  {
    slug: "pitching-13u14u-mound-command-bullpen",
    name: "Mound Command Bullpen",
    category: "pitching",
    ageTiers: ["13U-14U"],
    skillLevels: ["competitive"],
    description:
      "Full bullpen locating multiple pitches for strikes while simulating count pressure (e.g. 'you're behind 2-0, throw a strike').",
    coachingCues:
      "Simulate game pressure through called counts, but keep the pitch count itself tracked against the 95/day limit.",
    equipment: "Balls, target or catcher",
    diagramType: "bullpen",
  },
  {
    slug: "pitching-13u14u-pickoff-hold-series",
    name: "Pickoff & Hold Series",
    category: "pitching",
    ageTiers: ["13U-14U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Pickoff moves and slide-step work from the stretch with simulated runners, building the ability to hold runners close.",
    coachingCues:
      "Vary the timing to keep it unpredictable, but stay within legal move mechanics. No balk habits.",
    equipment: "Balls, bases",
    diagramType: "bullpen",
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
    diagramType: "live-scrimmage",
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
    diagramType: "live-scrimmage",
  },
  {
    slug: "mixed-13u14u-full-count-situational-scrimmage",
    name: "Full Count Situational Scrimmage",
    category: "mixed",
    ageTiers: ["13U-14U"],
    skillLevels: ["intermediate", "competitive"],
    description:
      "Live scrimmage cycling through a variety of ball-strike counts and situations to build in-game decision-making.",
    coachingCues:
      "Vary the starting count each at-bat so hitters and pitchers practice adjusting approach on the fly.",
    equipment: "Balls, bats, bases, L-screen",
    diagramType: "live-scrimmage",
  },
  {
    slug: "mixed-13u14u-late-inning-game-simulation",
    name: "Late-Inning Game Simulation",
    category: "mixed",
    ageTiers: ["13U-14U"],
    skillLevels: ["competitive"],
    description:
      "Live scrimmage simulating late-inning, close-game pressure situations to build composure under game stress.",
    coachingCues:
      "Narrate the game situation ('bottom of the 6th, one-run game') to build the mental side alongside the physical reps.",
    equipment: "Balls, bats, bases, L-screen",
    diagramType: "live-scrimmage",
  },
];

export const DRILL_SEED: DrillSeedEntry[] = [
  ...TIER_6U_8U,
  ...TIER_9U_10U,
  ...TIER_11U_12U,
  ...TIER_13U_14U,
];
